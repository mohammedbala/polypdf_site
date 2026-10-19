// Offline editorial normalization. No user documents or runtime translation requests.
'use strict';
const fs=require('fs'),path=require('path'),OpenCC=require('opencc-js');
const file=path.resolve(__dirname,'../../src/toolkit/translations/zh-tw.json');
const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
const convert=OpenCC.Converter({from:'cn',to:'twp'});let changed=0;
for(const [key,value]of Object.entries(catalog.strings)){const next=convert(value);if(value!==next){catalog.strings[key]=next;changed++;}}
catalog.scriptNormalization='OpenCC 1.4.2 s2twp; Traditional Chinese Taiwan characters and phrases';
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log(`Traditional Chinese editorial normalization: ${changed} strings.`);
// "Text to" can be read as the verb "send an SMS" in short search titles.
// These labels explicitly say convert, rather than send a message.
const corrections={
  ja:{'Text to PDF':'テキストをPDFに変換','Text to PDF online':'テキストをPDFに変換（オンライン）',
    'PDF to text':'PDFからテキストを抽出','PDF to text online':'オンラインでPDFからテキストを抽出',
    'How to use PDF to text':'PDFからテキストを抽出する方法','About PDF to text':'PDFからのテキスト抽出について'},
  ko:{'Text to PDF':'텍스트를 PDF로 변환','Text to PDF online':'온라인에서 텍스트를 PDF로 변환',
    'How to use Text to PDF':'텍스트를 PDF로 변환하는 방법','About Text to PDF':'텍스트를 PDF로 변환하기',
    'PDF to text':'PDF에서 텍스트 추출','PDF to text online':'온라인 PDF 텍스트 추출',
    'How to use PDF to text':'PDF에서 텍스트를 추출하는 방법','About PDF to text':'PDF 텍스트 추출 안내'},
  bn:{'Text to PDF':'লেখা থেকে PDF তৈরি করুন','Text to PDF online':'অনলাইনে লেখা থেকে PDF তৈরি করুন',
    'How to use Text to PDF':'লেখা থেকে PDF তৈরি করার পদ্ধতি','About Text to PDF':'লেখা থেকে PDF তৈরি সম্পর্কে',
    'PDF to text':'PDF থেকে লেখা বের করুন','PDF to text online':'অনলাইনে PDF থেকে লেখা বের করুন',
    'How to use PDF to text':'PDF থেকে লেখা বের করার পদ্ধতি','About PDF to text':'PDF থেকে লেখা বের করা সম্পর্কে'}
};
for(const [id,strings]of Object.entries(corrections)){
  const target=path.resolve(__dirname,`../../src/toolkit/translations/${id}.json`),data=JSON.parse(fs.readFileSync(target,'utf8'));
  Object.assign(data.strings,strings);data.editorialNotes='Conversion direction and text-to-PDF labels clarified.';
  fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');
}
