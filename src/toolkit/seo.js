import catalog from './catalog.json';
import pageContent from './page-content.json';
import metadata from '../lib/route-metadata.json';
import { sourceRoute, translateText, toolkitLocales } from './language';

const origin = 'https://www.polypdf.com';
export function toolkitMetaValues(seo, locale) {
  return {title:seo.title,description:seo.description,robots:'index, follow, max-image-preview:large',
    'og:type':'website','og:title':seo.title,'og:description':seo.description,'og:url':seo.url,'og:image':seo.image,'og:image:alt':seo.imageAlt,
    'og:locale':locale.og,'og:image:width':'1200','og:image:height':'630',
    'twitter:card':'summary_large_image','twitter:url':seo.url,'twitter:title':seo.title,'twitter:description':seo.description,'twitter:image':seo.image,'twitter:image:alt':seo.imageAlt};
}
export function toolkitSEO(pathname, language) {
  const route = sourceRoute(pathname), tool = catalog.find(t => route === `/tools/${t.id}`);
  const t = text => translateText(text, language);
  const path = route + '/';
  const url = origin + (language ? `/${language.locale.id}` : '') + path;
  const title = tool && language ? `${t(pageContent[tool.id].heading || `${tool.name} online`)} | PolyPDF` : t(metadata[route].title);
  const description = t(tool ? pageContent[tool.id].description : metadata[route].description);
  const image = origin + (tool ? `/tools/social/${tool.id}.png` : '/og-image.png');
  const imageAlt = tool ? t(`${tool.name} — free browser PDF tool`) : t('36 free browser PDF tools');
  const alternatives = [{language:'en',href:origin+path}, ...toolkitLocales.map(l => ({language:l.language,href:`${origin}/${l.id}${path}`})),{language:'x-default',href:origin+path}];
  const inLanguage = language?.locale.language || 'en';
  const localized = p => origin + (language ? `/${language.locale.id}` : '') + p;
  const blocks = [{ '@type':tool ? 'WebPage' : route === '/tools' ? 'CollectionPage' : 'WebPage', '@id':url+'#webpage', url, name:title, description, inLanguage,
    isAccessibleForFree:true, publisher:{'@id':origin+'/#organization'}, ...(language ? {translationOfWork:{'@type':'WebPage',url:origin+path,inLanguage:'en'}} : {}),
    ...(tool ? {mainEntity:{'@id':url+'#tool'}} : {}) },
    {'@type':'BreadcrumbList',itemListElement:[{name:t('All PDF tools'),item:localized('/tools/')}, ...(tool ? [{name:t(tool.name),item:url}] : [])].map((e,i) => ({'@type':'ListItem',position:i+1,...e}))}];
  if(tool) blocks.push({'@type':'WebApplication','@id':url+'#tool',name:t(tool.name),description:t(tool.answer),url,inLanguage,image,
    applicationCategory:'UtilitiesApplication',operatingSystem:t('Modern web browser'), browserRequirements:'JavaScript; File API; Canvas; Web Workers',
    isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},publisher:{'@id':origin+'/#organization'},
    featureList:[t(tool.summary),t(tool.limitation)], potentialAction:{'@type':'UseAction',target:url}});
  if(route === '/tools') blocks.push({'@type':'ItemList',name:t('36 free browser PDF tools'),numberOfItems:36,itemListElement:catalog.map((tool,i) => ({'@type':'ListItem',position:i+1,name:t(tool.name),url:localized(`/tools/${tool.id}/`)}))});
  return {title,description,url,image,imageAlt,alternatives,blocks:blocks.map(b => ({'@context':'https://schema.org',...b}))};
}
