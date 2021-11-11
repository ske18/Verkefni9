import { el, empty } from './helpers.js';
import { fetchNews } from './news.js';

/**
 * Föll sem sjá um að kalla í `fetchNews` og birta viðmót:
 * - Loading state meðan gögn eru sótt
 * - Villu state ef villa kemur upp við að sækja gögn
 * - Birta gögnin ef allt OK
 * Fyrir gögnin eru líka búnir til takkar sem leyfa að fara milli forsíðu og
 * flokks *án þess* að nota sjálfgefna <a href> virkni—við tökum yfir og sjáum
 * um sjálf með History API.
 */

/**
 * Sér um smell á flokk og birtir flokkinn *á sömu síðu* og við erum á.
 * Þarf að:
 * - Stoppa sjálfgefna hegðun <a href>
 * - Tæma `container` þ.a. ekki sé verið að setja efni ofan í annað efni
 * - Útbúa link sem fer til baka frá flokk á forsíðu, þess vegna þarf `newsItemLimit`
 * - Sækja og birta flokk
 * - Bæta við færslu í `history` þ.a. back takki virki
 *
 * Notum lokun þ.a. við getum útbúið föll fyrir alla flokka með einu falli. Notkun:
 * ```
 * link.addEventListener('click', handleCategoryClick(categoryId, container, newsItemLimit));
 * ```
 *
 * @param {string} id ID á flokk sem birta á eftir að smellt er
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleCategoryClick(id, container, newsItemLimit) {
  return (e) => {
    e.preventDefault();

    // TODO útfæra
    empty(container);
    window.history.pushState({}, '', '/?category=' + id);
    const takki = createCategoryBackLink(container, newsItemLimit);
    fetchAndRenderCategory(id, container, takki);
  };
}

/**
 * Eins og `handleCategoryClick`, nema býr til link sem fer á forsíðu.
 *
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleBackClick(container, newsItemLimit) {
  return (e) => {
    e.preventDefault();

    // TODO útfæra
    empty(container);
    window.history.pushState({}, '', '/');
    fetchAndRenderLists(container, newsItemLimit);
  };
}

/**
 * Útbýr takka sem fer á forsíðu.
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {HTMLElement} Element með takka sem fer á forsíðu
 */
export function createCategoryBackLink(container, newsItemLimit) {
  // TODO útfæra
  const takki = el('a', 'Til baka');
  takki.classList.add('news__link');
  takki.setAttribute('href', '/');
  takki.addEventListener('click', handleBackClick);
  return takki;
}

/**
 * Sækir grunnlista af fréttum, síðan hvern flokk fyrir sig og birtir nýjustu
 * N fréttir úr þeim flokk með `fetchAndRenderCategory()`
 * @param {HTMLElement} container Element sem mun innihalda allar fréttir
 * @param {number} newsItemLimit Hámark fjöldi frétta sem á að birta í yfirliti
 */
export async function fetchAndRenderLists(container, newsItemLimit) {
  // Byrjum á að birta loading skilaboð
  const loadingElement = el('p', 'Sæki lista af fréttum..');

  // Birtum þau beint á container
  container.appendChild(loadingElement);

  // Sækjum yfirlit með öllum flokkum, hér þarf að hugsa um Promises!
  const newsIndex = await fetchNews();

  // Fjarlægjum loading skilaboð
  container.removeChild(loadingElement);

  // Athugum hvort villa hafi komið upp => fetchNews skilaði null
  if (newsIndex === null) {
    const villa = el('p', 'Villa kom upp');
    container.appendChild(villa);
    return;
  }

  // Athugum hvort engir fréttaflokkar => fetchNews skilaði tómu fylki
  if (newsIndex.length === 0) {
    const villa = el('p', 'Engir fréttaflokkar');
    container.appendChild(villa);
    return;
  }

  // Búum til <section> sem heldur utan um allt
  const Frettir = el('div');
  Frettir.classList.add('newsList__list');
  const blabla = el('section', Frettir);
  blabla.classList.add('news__list');
  container.appendChild(blabla);

  // Höfum ekki-tómt fylki af fréttaflokkum! Ítrum í gegn og birtum
  // Þegar það er smellt á flokka link, þá sjáum við um að birta fréttirnar, ekki default virknin
  for (let i = 0; i < newsIndex.length; i++) {
    const element = newsIndex[i];
    const div = el('div');
    div.classList.add('newsList__item');
    Frettir.appendChild(div);
    const takki = el('a', 'Allar fréttir');
    takki.classList.add('news__link');
    takki.setAttribute('href', '/?category=', element.id);
    takki.addEventListener(
      'click',
      handleCategoryClick(element.id, container, newsItemLimit)
    );
    fetchAndRenderCategory(element.id, div, takki, newsItemLimit);
  }
}

/**
 * Sækir gögn fyrir flokk og birtir í DOM.
 * @param {string} id ID á category sem við erum að sækja
 * @param {HTMLElement} parent Element sem setja á flokkinn í
 * @param {HTMLELement | null} [link=null] Linkur sem á að setja eftir fréttum
 * @param {number} [limit=Infinity] Hámarks fjöldi frétta til að sýna
 */
export async function fetchAndRenderCategory(
  id,
  parent,
  link = null,
  limit = Infinity
) {
  // Búum til <section> sem heldur utan um flokkinn
  const flokkur = el('section');
  flokkur.classList.add('news');

  // Bætum við parent og þannig DOM, allar breytingar héðan í frá fara gegnum
  // container sem er tengt parent
  parent.appendChild(flokkur);

  // Setjum inn loading skilaboð fyrir flokkinn
  const loadingElement = el('p', 'Sæki lista af fréttum..');
  flokkur.appendChild(loadingElement);

  // Sækjum gögn fyrir flokkinn og bíðum
  const newsIndex = await fetchNews(id);

  // Fjarlægjum loading skilaboð
  flokkur.removeChild(loadingElement);

  // Ef það er linkur, bæta honum við
  if (link) {
    flokkur.appendChild(link);
  }

  // Villuskilaboð ef villa og hættum
  if (newsIndex === null) {
    const villa = el('p', 'Villa kom út');
    flokkur.appendChild(villa);
    return;
  }

  // Skilaboð ef engar fréttir og hættum
  if (newsIndex.items.length === 0) {
    const villa = el('p', 'Engir fréttaflokkar');
    flokkur.appendChild(villa);
    return;
  }

  // Bætum við titli
  const title = el('h2', newsIndex.title);
  title.classList.add('news__title');
  flokkur.appendChild(title);

  // Höfum fréttir! Ítrum og bætum við <ul>
  const linkur = el('ul');
  linkur.classList.add('news__list');
  flokkur.appendChild(linkur);
  for (let i = 0; i < newsIndex.items.length && i < limit; i++) {
    const element = newsIndex.items[i];
    const tengill = el('a', element.title);
    tengill.setAttribute('href', element.link);
    const listi = el('li', tengill);
    listi.classList.add('news__item');
    linkur.appendChild(listi);
  }
}
