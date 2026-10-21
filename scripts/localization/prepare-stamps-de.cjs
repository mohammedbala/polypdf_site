'use strict';
// Bind the German worked example to the current English guide without changing it.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=require('../international/content.cjs'),{localizePageElements}=require('./pages.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const source=read('src/content/guides/create-interactive-pdf-stamps.js');
const context={};vm.createContext(context);
vm.runInContext(source.replace(/^import (\w+) from '[^']+';/gm,'const $1="image";').replace('export default interactiveStampGuide;','this.guide=interactiveStampGuide;'),context);
const g=context.guide,text={},put=(source,target)=>{assert.ok(source&&target);text[c.normalize(source)]=target;};
put(g.tag,'Anmerkungen und Planprüfung');
put('Release review','Stand der Anleitung');put('Walkthrough verified','Ablauf geprüft');
put('Translated from the English edition. Screenshots and app control names may remain in English. Original example units and verification dates are preserved. Prices are in USD; checkout, account, release feeds, and policies are in English.','Dieser deutsche Übungsablauf verwendet deutsche App-Aufnahmen und eine metrische Beispielzeichnung für Deutschland. Geprüft wurde der lokale Mac-Entwicklungsstand; andere Anleitungen können noch englische Inhalte enthalten. Preise sind in USD; Kaufabwicklung, Konto, Release-Feeds und Richtlinien sind auf Englisch.');
put(g.metaDescription,'Interaktive Prüfstempel in der deutschen PolyPDF-Oberfläche erstellen: leere Vorlage, Pflichtangabe, automatisches Datum und gespeicherte deutsche Beispiel-PDF.');
put(g.excerpt,'Einen deutschen Prüfstempel aufbauen, bei jeder Platzierung eine neue prüfende Person abfragen und die Vorlage für weitere Planprüfungen speichern.');
put(g.quickAnswer,'Öffnen Sie die deutsche Übungszeichnung und im Stempel-Menü den interaktiven Stempel-Editor. Erstellen Sie eine 300 × 140 pt große Vorlage mit Prüfvermerk, prüfender Person und aktuellem Datum. Lassen Sie Zum Werkzeugset hinzufügen eingeschaltet. Wählen Sie Auf Seite einfügen, klicken Sie in den freien Bereich unterhalb des Plans und geben Sie Musterprüfung ein. Speichern Sie eine neue PDF und öffnen Sie sie nach einem vollständigen App-Neustart erneut.');
put(g.lede,'Dieses Beispiel erstellt den wiederverwendbaren Stempel Planprüfung - Übung auf einer fiktiven deutschen A2-Zeichnung im Maßstab 1:50. GEPRÜFT - ÜBUNG bleibt fest, die prüfende Person wird bei jeder Platzierung neu abgefragt und das Datum automatisch eingesetzt. Die Aufnahmen, die Vorlage und die gespeicherte PDF gehören zu demselben deutschen Mac-Durchlauf.');
const alts=[
 'Deutscher PolyPDF-Stempel-Editor mit drei Feldern auf einer 300 × 140 pt großen Vorlage und aktivierter Speicherung im Werkzeugset',
 'Neuer deutscher interaktiver Stempel mit leerer 240 × 240 pt großer Zeichenfläche und aktiviertem Zum Werkzeugset hinzufügen',
 'Deutscher Platzierungsdialog mit Pflichtangabe Prüfende Person, festem Prüfvermerk und automatisch eingesetztem Datum',
 'Deutscher Prüfstempel GEPRÜFT - ÜBUNG mit Musterprüfung und 21.10.2026 im freien Bereich unter der A2-Übungszeichnung'
];
const figures=[g.heroImage,g.sections[0].body[1],g.sections[3].body[2],g.sections[4].body[0]];
figures.forEach((f,i)=>{put(f.alt,alts[i]);put('Scrollable image: '+f.alt,'Scrollbares Bild: '+alts[i]);});
put(g.heroImage.caption,'Der tatsächliche deutsche Editor mit einer 300 × 140 pt großen Vorlage und drei Textfeldern. Prüfvermerk ist fest, Prüfende Person ist eine erforderliche Eingabe ohne Vorgabewert und Prüfdatum verwendet das aktuelle Datum. Die Vorlage wird im Werkzeugset gespeichert.');
put(g.sections[0].body[1].caption,'Ein neuer Stempel beginnt mit einer leeren 240 × 240 pt großen Fläche und ohne Felder. Zum Werkzeugset hinzufügen ist in diesem Entwicklungsstand bereits aktiviert. Weder die offene PDF-Seite noch eine ausgewählte Anmerkung wird in die Vorlage kopiert.');
put(g.sections[3].body[2].caption,'Der Dialog verlangt eine prüfende Person. Hier wird der fiktive Wert Musterprüfung eingegeben. Prüfvermerk und Datum sind sichtbar, aber nicht bearbeitbar. Ohne Pflichtangabe verweigert die App die Platzierung.');
put(g.sections[4].body[0].caption,'Der 300 × 140 pt große Stempel liegt im freien Bereich unter dem Grundriss, rechts neben der Kalibrierungsstrecke und links vom Schriftfeld. Die deutsche Zeichnung bleibt unverändert. Gespeichert wird eine PDF-Stempelanmerkung mit sichtbarer Darstellung und den zugehörigen PolyPDF-Metadaten.');
const titles=['Mit einer leeren Vorlage beginnen','Drei Felder mit klaren Aufgaben','Felder positionieren und prüfen','Vorlage speichern und erneut verwenden','PDF speichern, neu öffnen und vergleichen'];
g.sections.forEach((s,i)=>put(s.title,titles[i]));
const items0=[
 'Laden Sie unten pruefplan-vorlage.pdf herunter und öffnen Sie die deutsche A2-Übungszeichnung. Sie ist eine Demonstration und keine Ausführungsplanung.',
 'Öffnen Sie den Pfeil neben Stempel und wählen Sie den Befehl zum Erstellen eines interaktiven Stempels.',
 'Nennen Sie die Vorlage Planprüfung - Übung. Setzen Sie Breite auf 300 pt und Höhe auf 140 pt, Füllung auf Weiß sowie Rand und Textfarbe auf #245b66. Die Randbreite beträgt 2 pt.',
 'Klicken Sie dreimal auf Feld hinzufügen. Legen Sie die unten beschriebenen Textfelder an; ohne Feld lässt sich die leere Vorlage nicht einfügen.'
];g.sections[0].body[0].items.forEach((s,i)=>put(s,items0[i]));
put(g.sections[0].body[2].text,'Die Größe des Stempels wird in PDF-Punkten angegeben. Der Maßstab 1:50 und die metrischen Abmessungen der Zeichnung ändern diese Werte nicht. Die deutsche Beispieldatei enthält außerdem eine bekannte Kalibrierungsstrecke.');
put(g.sections[1].body[0].text,'Wählen Sie jeweils ein Feld aus und stellen Sie Beschriftung, Typ, Quelle, Vorgabewert, Platzierungsverhalten und Darstellung ein. Alle drei Felder dieses Beispiels sind Textfelder. Die Beschriftung erscheint im Editor und in der Abfrage; auf dem Stempel steht der jeweilige Feldwert.');
const table=g.sections[1].body[1];put(table.caption,'Die drei Textfelder der deutschen Vorlage');
table.headers.forEach((s,i)=>put(s,['Feld','Wert','Beim Platzieren fragen'][i]));
const rows=[['Prüfvermerk','Benutzerdefinierter Wert: GEPRÜFT - ÜBUNG','Aus; dieser Text bleibt fest'],['Prüfende Person','Benutzerdefinierter Wert: leer lassen','Ein; Erforderlich einschalten'],['Prüfdatum','Aktuelles Datum','Aus; bei jeder Platzierung neu ermittelt']];
table.rows.forEach((r,i)=>r.forEach((s,j)=>put(s,rows[i][j])));
put(g.sections[1].body[2].text,'Lassen Sie den Vorgabewert für Prüfende Person leer. Aktivieren Sie Beim Platzieren fragen und Erforderlich. So verlangt auch eine später wiederverwendete Vorlage eine neue Eingabe und übernimmt nicht den Namen der vorherigen Platzierung.');
put(g.sections[1].body[3].text,'Für Prüfdatum wählen Sie Aktuelles Datum und lassen die Abfrage ausgeschaltet. Im geprüften Durchlauf wurde 21.10.2026 eingesetzt. Automatische Werte werden bei einer neuen Platzierung ermittelt; ein bereits gespeicherter Stempel behält sein damaliges Datum.');
const layout=[
 'Prüfvermerk: links 12, oben 12, Breite 276, Höhe 38 pt; Arial 22 pt, fett und zentriert.',
 'Prüfende Person: links 12, oben 58, Breite 276, Höhe 28 pt; Arial 16 pt und zentriert.',
 'Prüfdatum: links 12, oben 98, Breite 276, Höhe 28 pt; Arial 16 pt und zentriert.',
 'Prüfen Sie die gesamte Vorschau. Alle drei Felder verwenden die Textfarbe #245b66. Die Beschriftung des noch leeren Personenfelds im Editor ist kein gespeicherter Vorgabewert.',
 'Probieren Sie für den späteren Einsatz längere Namen aus und vergrößern Sie die Vorlage bei Bedarf. Dieses Beispiel belegt die Darstellung von Musterprüfung; beliebig lange Eingaben wurden nicht geprüft.'
];g.sections[2].body[0].items.forEach((s,i)=>put(s,layout[i]));
put(g.sections[2].body[1].text,'Auswahlrahmen, Feldbeschriftungen und Größenanfasser gehören zur Bearbeitung. Sie erscheinen nicht als Teil des gespeicherten Stempels.');
put(g.sections[3].body[0].text,'Lassen Sie Zum Werkzeugset hinzufügen für diese Übung eingeschaltet und verwenden Sie Benutzerdefinierte Stempel als Ziel. Die Vorlage bleibt damit nach einem App-Neustart verfügbar. Für eine einmalige Platzierung können Sie das Kontrollkästchen ausschalten.');
const place=[
 'Wählen Sie Auf Seite einfügen.',
 'Klicken Sie in den freien Bereich unter dem Grundriss, rechts neben der Kalibrierungsstrecke und links vom Schriftfeld. Verdecken Sie keine Planmaße oder Beschriftungen.',
 'Lassen Sie Prüfende Person zunächst leer und versuchen Sie die Platzierung: Die App fordert diese Pflichtangabe an. Tragen Sie anschließend Musterprüfung ein.',
 'Wählen Sie Stempel platzieren. Prüfen Sie Prüfvermerk, Personenangabe, Datum und Position auf dem Blatt.',
 'Nach dem Speichern und einem vollständigen App-Neustart wählen Sie Planprüfung - Übung erneut aus dem Stempel-Menü. Beim nächsten Klick auf die Seite ist das Personenfeld wieder leer. Brechen Sie diese zweite Abfrage ab, wenn Sie nur den einen Beispielstempel behalten möchten.'
];g.sections[3].body[1].items.forEach((s,i)=>put(s,place[i]));
put(g.sections[4].body[1].text,'Speichern Sie über Datei › Speichern unter… eine separate PDF, beenden Sie PolyPDF vollständig und öffnen Sie das Ergebnis erneut. Im geprüften Mac-Durchlauf bleiben der Stempel, alle drei Werte und die Position erhalten. Eine unabhängige PDF-Darstellung bestätigt lesbare Umlaute und die unveränderte Zeichnung. Prüfen Sie zusätzlich das PDF-Programm Ihrer Empfänger.');
put(g.sections[4].body[2].text,'Die erneut geöffnete native Stempeldarstellung bewahrt ihre Werte und Metadaten. Im hier geprüften Stand lassen sich an diesem importierten Artwork die Feldwerte jedoch nicht über den Vorlageneditor ändern; die App bietet Verschieben, Skalieren und Drehen an. Verwenden Sie für neue Angaben die gespeicherte Vorlage und eine neue Platzierung. Änderungen an einer Vorlage ändern vorhandene Stempel nicht.');
put(g.sections[4].body[3].text,'GEPRÜFT - ÜBUNG ist ein fiktiver sichtbarer Prüfvermerk und kein Nachweis einer Freigabe. Die gespeicherte Darstellung ist ein Rasterbild; ihre Werte stehen zusätzlich in PolyPDF-Metadaten, nicht als auswählbarer Seitentext. Dieser Stempel erzeugt keine Zertifikatssignatur und führt kein importiertes PDF-JavaScript aus.');
const answers=[
 'Nein. Eine neue Vorlage hat eine leere Zeichenfläche und keine Felder. Die offene PDF-Seite, ausgewählte Anmerkungen und Formularfelder werden nicht kopiert.',
 'Nein. In diesem Entwicklungsstand ist Zum Werkzeugset hinzufügen bereits eingeschaltet. Lassen Sie es für die wiederverwendbare Übung an oder schalten Sie es für eine einmalige Platzierung aus.',
 'Ja. Lassen Sie den Vorgabewert für Prüfende Person leer und aktivieren Sie Abfrage und Pflichtangabe. Prüfdatum verwendet das aktuelle Datum. Nach einem Neustart wurde eine neue leere Personenabfrage aus derselben gespeicherten Vorlage geprüft; vorhandene Stempel behalten ihre Werte.',
 'Nein. Der sichtbare Prüfvermerk bestätigt weder die Identität einer Person noch eine rechtsverbindliche Freigabe. Eine Zertifikatssignatur ist ein eigener Ablauf.'
];g.faqs.forEach((f,i)=>put(f.answer,answers[i]));
const questions=['Kopiert ein neuer Stempel die geöffnete PDF-Seite?','Muss jede Vorlage in einem Werkzeugset gespeichert werden?','Kann ich bei jeder Platzierung eine neue Person und ein neues Datum verwenden?','Ist ein Prüfstempel eine digitale Signatur?'];
g.faqs.forEach((f,i)=>put(f.question,questions[i]));
put('— '+g.sources[0].note,'— Historischer Einführungshinweis. Dieser deutsche Durchlauf wurde separat am 21.10.2026 im lokalen macOS-Entwicklungsstand 1.6.17 Build 84 geprüft.');
const {dom,schema,meta}=c.sourcePage(path.join(root,'build'),'/blog/create-interactive-pdf-stamps');
const targets=['Deutscher Stempel-Durchlauf im lokalen Entwicklungsstand 1.6.17 Build 84; kein Nachweis eines veröffentlichten Installers.','21. Oktober 2026','PolyPDF 1.6.17 Build 84 — deutscher lokaler Entwicklungsstand','Für diesen Durchlauf geprüft: macOS'];
const elements=targets.map((target,i)=>{const selector=`.blog-verification > div:nth-child(${i+1}) dd`;return {selector,source:c.normalize(dom.window.document.querySelector(selector).textContent),target};});
const proof=JSON.parse(read('public/localized-media/de/samples/stamps/export-verification.json'));
const profile={status:'complete',locale:'de-DE',region:'DE',evidence:'/localized-media/de/guides/stamps/verification.json',elements,text,extraDownloads:[
 {url:'/localized-media/de/samples/stamps/pruefplan-vorlage.pdf',label:'Deutsche A2-Übungszeichnung herunterladen (PDF)',note:'Fiktiver Grundriss im Maßstab 1:50 mit metrischen Maßen und freiem Bereich für den Prüfstempel.',sha256:proof.files['pruefplan-vorlage.pdf']},
 {url:'/localized-media/de/samples/stamps/pruefplan-mit-stempel.pdf',label:'Gespeichertes deutsches Stempelbeispiel herunterladen (PDF)',note:'Tatsächliche native Speicherung; Stempel und Werte nach vollständigem App-Neustart sowie unabhängig im PDF geprüft.',sha256:proof.files['pruefplan-mit-stempel.pdf']}
]};
// Omitted duplicate figures and unused accessibility strings must not become stale overrides.
const seen=new Set(),collect=s=>{seen.add(c.normalize(s));return s;};
localizePageElements(dom.window.document,{language:'de'},profile);c.translateDOM(dom.window.document.body,collect);c.mapSchema(schema,collect,{language:'de',id:'de'});Object.values(meta).filter(v=>typeof v==='string').forEach(collect);
const omitted=Object.keys(text).filter(k=>!seen.has(k));
for(const key of omitted)delete text[key];
for(const required of [g.quickAnswer,g.lede,g.sections[4].body[2].text,g.faqs[1].answer])assert.ok(text[c.normalize(required)]);
fs.writeFileSync(path.join(root,'scripts/localization/stamps-de.json'),JSON.stringify(profile,null,2)+'\n');
console.log(`German stamp profile: ${Object.keys(text).length} text bindings, ${elements.length} evidence bindings, two PDF downloads; omitted ${omitted.length} non-rendered strings.`);
