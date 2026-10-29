"""Read-only, exact monthly CSV aggregates. No model, network or persistence."""
import argparse
import csv
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP, localcontext
import hashlib
import json
from pathlib import Path
import re

UNITS={'元':100,'万元':1000000}

def cents(value,unit,line,column):
    if unit not in UNITS: raise ValueError(f'line {line}: unsupported unit; map explicitly before processing')
    if value is None or not re.fullmatch(r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)',value.strip()):
        raise ValueError(f'line {line}: invalid or missing amount in {column}')
    try:
        with localcontext() as context:
            context.prec=60
            amount=Decimal(value.strip())*UNITS[unit]
            if not amount.is_finite() or abs(amount)>10**30 or amount!=amount.to_integral_value():
                raise ValueError(f'line {line}: amount out of range or smaller than one cent in {column}')
            return int(amount)
    except InvalidOperation as error:
        raise ValueError(f'line {line}: invalid decimal in {column}') from error

def money(value):
    sign='-' if value<0 else ''
    value=abs(value)
    return f'{sign}{value//100}.{value%100:02d}'

def summarize(file,months,month_column='month',gross_column='gross',refund_column='refund',unit_column='unit',id_column=None,compare=None,compact=False):
    file=Path(file)
    months=list(dict.fromkeys(months))
    if not months or any(not re.fullmatch(r'\d{4}-(?:0[1-9]|1[0-2])',month) for month in months):
        raise ValueError('months must explicitly use YYYY-MM')
    aggregates={month:{'rows':0,'gross':0,'refund':0,'first_line':None,'last_line':None} for month in months}
    seen=set();total=0;excluded=0
    raw=file.read_bytes()
    if len(raw)>20_000_000: raise ValueError('file exceeds the 20 MB local-processing limit')
    # Decode before parsing; never pretend undecodable content was read.
    text=raw.decode('utf-8-sig',errors='strict')
    if '\0' in text: raise ValueError('binary data is not CSV text')
    import io
    reader=csv.DictReader(io.StringIO(text,newline=''),strict=True)
    required=[month_column,gross_column,refund_column,unit_column]+([id_column] if id_column else [])
    if len(set(required))!=len(required): raise ValueError('column roles must be distinct')
    if not reader.fieldnames or len(set(reader.fieldnames))!=len(reader.fieldnames) or any(column not in reader.fieldnames for column in required):
        raise ValueError('required columns missing or duplicate headers')
    for row in reader:
        total+=1;line=reader.line_num
        if None in row or any(value is None for value in row.values()): raise ValueError(f'line {line}: mismatched column count')
        if id_column:
            identity=row[id_column].strip()
            if not identity or identity in seen: raise ValueError(f'line {line}: missing or duplicate ID')
            seen.add(identity)
        period=row[month_column].strip()
        if not re.fullmatch(r'\d{4}-(?:0[1-9]|1[0-2])',period): raise ValueError(f'line {line}: ambiguous month format')
        unit=row[unit_column].strip()
        gross=cents(row[gross_column],unit,line,gross_column)
        refund=cents(row[refund_column],unit,line,refund_column)
        if period not in aggregates: excluded+=1;continue
        aggregate=aggregates[period]
        aggregate['rows']+=1;aggregate['gross']+=gross;aggregate['refund']+=refund
        aggregate['first_line']=aggregate['first_line'] or line;aggregate['last_line']=line
    result={}
    for month,aggregate in aggregates.items():
        result[month]={'rows':aggregate['rows'],'gross_yuan':money(aggregate['gross']) if aggregate['rows'] else None,'refund_yuan':money(aggregate['refund']) if aggregate['rows'] else None,'net_yuan':money(aggregate['gross']-aggregate['refund']) if aggregate['rows'] else None,'line_span':[aggregate['first_line'],aggregate['last_line']] if aggregate['rows'] else None}
    output={'source_file':file.name,'source_sha256':hashlib.sha256(raw).hexdigest(),'total_rows':total,'included_rows':total-excluded,'excluded_rows':excluded,'formula':'net = gross - refund; unit converted to yuan; missing month is null, not zero','months':result,'scope':'amount aggregates only; row-level text/causes and other metrics are not summarized'}
    if compare:
        if len(compare)!=2 or compare[0]==compare[1] or any(month not in aggregates for month in compare):
            raise ValueError('comparison requires two distinct selected months: BASE CURRENT')
        base,current=(aggregates[month] for month in compare)
        comparison={'base_month':compare[0],'current_month':compare[1],'net_change_yuan':None,'net_change_pct':None}
        if not base['rows'] or not current['rows']:
            comparison['reason']='missing month is not zero'
        else:
            base_net=base['gross']-base['refund'];current_net=current['gross']-current['refund']
            comparison['net_change_yuan']=money(current_net-base_net)
            if base_net<=0:comparison['reason']='non-positive baseline; ordinary growth percentage not reported'
            else:
                with localcontext() as context:
                    context.prec=60
                    comparison['net_change_pct']=str((Decimal(current_net-base_net)/Decimal(base_net)*100).quantize(Decimal('0.01'),rounding=ROUND_HALF_UP))
        output['comparison']=comparison
    if compact:
        output={key:value for key,value in output.items() if key in ['source_sha256','total_rows','excluded_rows','months','comparison']}
        output['months']={month:{key:value for key,value in item.items() if key!='line_span'} for month,item in result.items()}
    return output

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',type=Path,required=True)
    parser.add_argument('--months',nargs='+',required=True)
    for role in ['month','gross','refund','unit']: parser.add_argument('--'+role+'-column',default=role)
    parser.add_argument('--id-column')
    parser.add_argument('--compare',nargs=2,metavar=('BASE','CURRENT'))
    parser.add_argument('--compact',action='store_true')
    args=parser.parse_args()
    try:
        result=summarize(args.input,args.months,args.month_column,args.gross_column,args.refund_column,args.unit_column,args.id_column,args.compare,args.compact)
        print(json.dumps(result,ensure_ascii=False,separators=(',',':')))
    except (ValueError,UnicodeError,csv.Error,OSError) as error:
        print(json.dumps({'status':'error','message':str(error)},ensure_ascii=False))
        raise SystemExit(1)
