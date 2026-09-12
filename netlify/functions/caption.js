const { json } = require('../lib/auth');

const DATA = {
  dogumgunu: {
    open: ['Yeni yaşın en tatlı hatırası burada 🎂✨', 'Bir dilek, bir mum, bir Pastacihanı hikâyesi 🥳'],
    tags: ['#doğumgünüpastası', '#butikpasta', '#silivripasta']
  },
  nisan: {
    open: ['İki kalbin “evet” dediği güne zarif bir dokunuş 💍', 'Birlikte yazılan hikâyenin ilk tatlı sayfası ✨'],
    tags: ['#nişanpastası', '#butikpasta', '#silivripasta']
  },
  soz: {
    open: ['O güzel sözün tatlı hatırası burada 💍', 'Mutluluğa atılan ilk adıma özel bir pasta 🌸'],
    tags: ['#sözpastası', '#butikpasta', '#silivripasta']
  },
  dugun: {
    open: ['Hayatınızın en güzel gününe yakışan zarif bir kutlama 👰🤵', 'Bir ömürlük “evet” için tasarlanan tatlı bir hatıra 💍'],
    tags: ['#düğünpastası', '#butikpasta', '#silivripasta']
  },
  babyshower: {
    open: ['Minik bir mucizeyi beklerken sofraya tatlı bir heyecan 💕', 'Hoş geldin demeden önce hazırlanan en tatlı sürpriz 👶'],
    tags: ['#babyshower', '#babyshowerpasta', '#silivripasta']
  },
  yildonumu: {
    open: ['Birlikte geçen yıllara, birlikte kesilecek tatlı bir pasta 💞', 'Aşkınızın her yılı ayrı bir hikâye, her dilimi ayrı bir mutluluk 🌹'],
    tags: ['#yıldönümüpastası', '#butikpasta', '#silivripasta']
  },
  kurumsal: {
    open: ['Markanızın özel gününe özel tasarım pasta 🏢✨', 'Yeni bir başlangıcı birlikte kutlamanın en tatlı yolu 🎉'],
    tags: ['#kurumsalpasta', '#açılışpastası', '#silivripasta']
  },
  genel: {
    open: ['Her özel ana yakışan, size özel bir hikâye 🎂', 'Hayalinizdeki pasta, Pastacihanı dokunuşuyla gerçeğe dönüşüyor ✨'],
    tags: ['#butikpasta', '#özeltasarımpasta', '#silivripasta']
  }
};

const BODY = [
  'Taze malzeme, özenli işçilik ve tamamen size özel bir tasarım. Silivri, Selimpaşa ve Kumburgaz çevresine teslimat.',
  'Rengi, lezzeti ve süslemesiyle kutlamanın ruhunu taşıyan butik bir pasta. Her ayrıntıyı birlikte tasarlıyoruz.',
  'Bu pastanın her katında güzel bir anı, her detayında kutlayan kişiye özel küçük bir dokunuş var.'
];

function pick(items, index) { return items[index % items.length]; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST desteklenir' });
  try {
    const body = JSON.parse(event.body || '{}');
    const occasion = String(body.occasion || 'genel').toLowerCase();
    const notes = String(body.notes || '').replace(/[<>\r\n]/g, ' ').trim().slice(0, 180);
    const data = DATA[occasion] || DATA.genel;
    const captions = [0, 1, 2].map((index) => {
      const detail = notes ? `${notes.charAt(0).toUpperCase()}${notes.slice(1)}. ` : '';
      const tags = [...data.tags, '#pastacihani'].slice(0, 5).join(' ');
      return `${pick(data.open, index)}\n\n${detail}${pick(BODY, index)}\n\nSipariş ve bilgi: 0554 810 63 01\n\n${tags}`;
    });
    return json(200, { text: captions.join('\n---\n'), mode: 'template' });
  } catch (_) {
    return json(400, { error: 'Geçersiz istek' });
  }
};
