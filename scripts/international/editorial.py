#!/usr/bin/env python3
"""Apply reviewed brand spelling and construction-term corrections to imported catalogs.
This is an explicit editorial step, not a runtime translator. Existing manual titles are
stored separately in editorial-titles.json, keyed by stable source route.
"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
brand=re.compile(r'PoliPDF|Polipdf|بولي\s*بي\s*دي\s*[إا]ف|بولي\s*PDF|पॉली\s*पीडीएफ|पॉली\s*PDF|ポリ\s*PDF|聚\s*PDF|多聚\s*PDF',re.I)
replacements={
 'es':{'medición de cantidades de construcción':'cómputo de cantidades','medición de la cantidad de construcción':'cómputo de cantidades','medición de cantidad de construcción':'cómputo de cantidades','dibujos en PDF':'planos en PDF','dibujos PDF':'planos PDF','dibujo PDF':'plano PDF','lista de defectos de construcción':'lista de repasos de obra'},
 'pt-br':{'medição de quantidade de construção':'levantamento de quantitativos','medição de quantidades de construção':'levantamento de quantitativos','desenhos em PDF':'plantas em PDF','lista de defeitos de construção':'lista de pendências da obra'},
 'de':{'Baumengenmessung':'Mengenermittlung','Messung der Baumengen':'Mengenermittlung','Messung von Baumengen':'Mengenermittlung','Messung der Baumenge':'Mengenermittlung','Baumengenmessungen':'Mengenermittlungen'},
 'fr':{'mesure des quantités de construction':'métré','mesures des quantités de construction':'métrés','dessins PDF':'plans PDF','dessin PDF':'plan PDF','liste des défauts de construction':'liste de réserves'},
 'ar':{'قياس كمية البناء':'حصر الكميات','قياس كميات البناء':'حصر الكميات','قياس كمية الإنشاء':'حصر الكميات'},
 'hi':{'निर्माण मात्रा माप':'मात्रा आकलन','निर्माण मात्रा मापन':'मात्रा आकलन'},
 'zh-cn':{'施工量测量':'工程量统计','建设量测量':'工程量统计','施工数量测量':'工程量统计','建设数量测量':'工程量统计','构建数量测量':'工程量统计','PDF 绘图':'PDF 图纸'},
 'ja':{'建設数量測定':'数量拾い','施工量計測':'数量拾い','構築数量測定':'数量拾い','施工数量測定':'数量拾い','PDF 描画':'PDF 図面','描画スケール':'図面の縮尺'}
}
for locale in json.loads((ROOT/'src/lib/locales.json').read_text()):
 file=ROOT/'src/content/translations'/f'{locale["id"]}.json'
 catalog=json.loads(file.read_text())
 for source,value in catalog['strings'].items():
  if 'PolyPDF' in source:value=brand.sub('PolyPDF',value)
  for before,after in sorted(replacements[locale['id']].items(),key=lambda x:len(x[0]),reverse=True):value=re.sub(re.escape(before),lambda m:after,value,flags=re.I)
  catalog['strings'][source]=value
 catalog['editorialReview']='Brand spelling, construction vocabulary and separately authored SEO titles; machine-assisted full prose, not certified native-speaker review.'
 file.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 print(locale['id'],len(catalog['strings']))
