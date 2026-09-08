#!/usr/bin/env python3
"""Explicit editorial import, never run in a production build.

Sends only extracted public website copy to Google's public translation endpoint.
Stores complete local catalogs; builds use no external translation services.
Resume with identical source strings. --locale limits an import to one language.
"""
import argparse, concurrent.futures, hashlib, json, re, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--locale');args=parser.parse_args()
source=json.loads((ROOT/'.tmp/international/source-strings.json').read_text())
locales=json.loads((ROOT/'src/lib/locales.json').read_text())
if args.locale: locales=[l for l in locales if l['id']==args.locale]
def protect(text,locale):
    # Disambiguate trade jargon in the source so the engine can inflect complete
    # target-language sentences naturally. Do not inject foreign nouns into English grammar.
    text=re.sub(r'\bquantity takeoff\b', 'construction quantity measurement', text, flags=re.I)
    text=re.sub(r'\btakeoffs?\b', 'construction quantity measurement', text, flags=re.I)
    text=re.sub(r'\bmarkups\b', 'annotations', text, flags=re.I)
    text=re.sub(r'\bmarkup\b', 'annotation', text, flags=re.I)
    text=re.sub(r'\bpunch[ -]lists?\b', 'construction defects list', text, flags=re.I)
    text=re.sub(r'\bredactions?\b', 'sensitive PDF content removal', text, flags=re.I)
    text=re.sub(r'\bredacting\b', 'removing sensitive PDF content', text, flags=re.I)
    text=re.sub(r'\bredacted\b', 'with sensitive PDF content removed', text, flags=re.I)
    text=re.sub(r'\bredact\b', 'remove sensitive content from', text, flags=re.I)
    text=re.sub(r'\b(?:sanitization|sanitation)\b', 'hidden PDF data cleanup', text, flags=re.I)
    text=re.sub(r'\bsanitize\b', 'clean hidden data from', text, flags=re.I)
    return text,[]

def request(text,target):
    url='https://translate.googleapis.com/translate_a/single?'+urllib.parse.urlencode({'client':'gtx','sl':'en','tl':target,'dt':'t','q':text})
    for attempt in range(5):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'PolyPDF-Editorial-Localization/1.0'})
            with urllib.request.urlopen(req,timeout=35) as response: data=json.load(response)
            translated=''.join(part[0] for part in data[0] if part[0])
            if not translated.strip(): raise ValueError('empty response')
            return translated
        except Exception:
            if attempt==4: raise
            time.sleep(min(2**attempt,12))

def restore(translated,replacements):
    for i,value in enumerate(replacements):
        token=rf'ZXQ\s*{i}\s*QXZ'
        if not re.search(token,translated,flags=re.I): raise ValueError(f'Lost glossary token {i}: {translated[:90]}')
        translated=re.sub(token,lambda m:value,translated,flags=re.I)
    if re.search(r'ZXQ|QXZ',translated,re.I):raise ValueError('Leaked glossary token')
    return translated.strip()

def run(locale):
    ident=locale['id']; target={'pt-br':'pt','zh-cn':'zh-CN'}.get(ident,ident)
    file=ROOT/'src/content/translations'/f'{ident}.json'
    catalog=json.loads(file.read_text()) if file.exists() else {'language':locale['language'],'provider':'Google Translate; construction terminology disambiguated before translation','strings':{}}
    pending=[s for s in source['strings'] if s not in catalog['strings']]
    batches=[]; batch=[]; length=0
    for s in pending:
        value,replacements=protect(s,ident)
        if length+len(value)>2600 and batch:batches.append(batch);batch=[];length=0
        batch.append((s,value,replacements));length+=len(value)+30
    if batch:batches.append(batch)
    for index,batch in enumerate(batches):
        # Numeric boundary markers survive translation and preserve string-to-string alignment.
        payload='\n\n'.join(f'[X{i:04d}X]\n{v}' for i,(_,v,_) in enumerate(batch))
        translated=request(payload,target)
        pieces=re.split(r'\[\s*X\s*(\d{4})\s*X\s*\]',translated,flags=re.I)
        valid=len(pieces)==len(batch)*2+1
        for i,(s,value,replacements) in enumerate(batch):
            try:
                if not valid or int(pieces[1+i*2])!=i:raise ValueError('Boundary mismatch')
                result=restore(pieces[2+i*2],replacements)
            except ValueError:
                result=restore(request(value,target),replacements)
            if not result:raise ValueError('Empty translation')
            catalog['strings'][s]=result
        catalog['sourceHash']=source['sourceHash']
        file.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
        if index%15==0 or index==len(batches)-1:print(f'{ident}: {index+1}/{len(batches)} batches; {len(catalog["strings"])}/{len(source["strings"])} strings',flush=True)
        time.sleep(.12)
    return ident
if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures={pool.submit(run,locale):locale['id'] for locale in locales}
        for future in concurrent.futures.as_completed(futures):
            try: print(f'Complete: {future.result()}',flush=True)
            except Exception as error: print(f'FAILED {futures[future]}: {error}',flush=True); raise
