# Deutsche Übungspläne: Schwärzen und Dokumentbereinigung

Die beiden fiktiven A3-Pläne zeigen ein vereinfachtes Bürgerhaus in Deutschland: 24,00 m × 12,00 m, Außenfläche 288,00 m², Maßstab 1:100. Maße, deutsche Beschriftungen, Papierformat, Datum und PDF-Sprachangabe gehören zusammen. Die Pläne dienen ausschließlich der Demonstration und sind keine Ausführungsplanung oder Normenzertifizierung.

## Schwärzungsübung

Öffnen Sie `pruefplan-schwaerzen.pdf`. Suchen Sie nach `VORGANG-LINDE-742`; die Kennung steht einmal als auswählbarer Seitentext rechts neben dem Grundriss. Das Rasterdetail unten links ist ein separates Bild.

1. Wählen Sie **Schwärzen** und ziehen Sie ein Rechteck eng um die Kennung. Die Bestätigung **Schwärzung anwenden** erscheint nach dem Zeichnen.
2. Prüfen Sie die Bestätigung, bevor Sie **Schwärzen** wählen. Die Änderung soll den Text entfernen; eine schwarze Darstellung allein ist kein Nachweis.
3. Speichern Sie unter dem neuen Namen `pruefplan-geschwaerzt.pdf`. Bewahren Sie die Quelle auf.
4. Schließen Sie die Datei und öffnen Sie genau die gespeicherte Kopie erneut. Suchen Sie wieder nach der vollständigen Kennung und prüfen Sie den extrahierten Text unabhängig.
5. Vergleichen Sie den restlichen Plan und das Rasterdetail mit der Quelle. Diese Inhalte sollen erhalten bleiben.

Der direkte Test des PDF-Kerns hat genau einen Textabschnitt entfernt. Die Kennung fehlt im extrahierten Text und in den geprüften dekodierten PDF-Objekten; der übrige Seitentext und die Bildpixel bleiben unverändert. Die Ausgabe enthält keine Verknüpfung auf eine frühere PDF-Revision. Dies ist noch kein Nachweis des nativen Speichern-Dialogs oder einer vollständigen Benutzeranleitung: Die App-Aufnahmen und der native Speichern-/Neuöffnen-Durchlauf stehen aus.

## Bereinigungsübung

Öffnen Sie separat `pruefplan-bereinigen.pdf`. Diese Quelle enthält ursprüngliche Dokumentmetadaten, einen harmlosen JavaScript-Namenseintrag (`void(0)`), einen direkten Seitenanhang `pruefnotiz.txt` und zwei Platzierungen desselben Rasterdetails. Das zweite Bild liegt in einem wiederverwendbaren Form-XObject.

1. Öffnen Sie **Dokument bereinigen**. Prüfen Sie die Optionen für Metadaten, Vorschaubilder, Anhänge sowie JavaScript und Aktionen. Die Entfernung von Formular- und Signaturfeldern bleibt ausgeschaltet.
2. Führen Sie die Bereinigung aus und speichern Sie unter `pruefplan-bereinigt.pdf`.
3. Untersuchen Sie die gespeicherte Datei unabhängig: Seitentext, beide Bilder, Metadaten, Aktionen und Anhänge sind getrennte Prüfgegenstände.

Im direkten Kerntest werden die ursprünglichen Metadaten und ein JavaScript-Eintrag entfernt. Der direkte Seitenanhang bleibt mit identischen Nutzdaten erhalten; die Kennung und beide Bilder bleiben ebenfalls erhalten. Eine Bereinigung entfernt hier keinen sichtbaren Seitentext. Die native Speicherung kann neue Erzeuger- und Änderungszeit-Metadaten hinzufügen; das wird im noch ausstehenden Speichern-Durchlauf gesondert geprüft.

Diese Ergebnisse gelten für die bereitgestellten fiktiven Beispiele. Sie belegen keine vollständige Entfernung vertraulicher Inhalte in beliebigen PDFs. Verwenden Sie für reale vertrauliche Unterlagen das freigegebene Prüfverfahren Ihrer Organisation und prüfen Sie die tatsächliche gespeicherte Datei.
