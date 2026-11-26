// Texte für Akt III – Das Grab.
// Quelle: drehbuch/DREHBUCH.md. Alle arabischen Texte und Übersetzungen sind Entwurf
// und müssen vor der Veröffentlichung vom Gelehrten geprüft werden (GELEHRTEN-PRUEFUNG.md).
//
// style: 'title' | 'quote' (Standard) | 'whisper' | 'question' | 'answer' | 'hint'

const BARA = 'Abu Dawud 4753 · Ahmad 18534';

export const TX = {
  // ======================= PROLOG + STERBEN =======================
  prologTitel: { style: 'title', ar: 'سَكْرَةُ الْمَوْتِ', de: 'Prolog · Die Trunkenheit des Todes' },
  jedeSeele: {
    ar: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ الْقِيَامَةِ',
    de: '„Jede Seele wird den Tod kosten. Und euer Lohn wird euch erst am Tag der Auferstehung voll ausbezahlt.“',
    src: 'Āl ʿImrān 3:185',
  },
  zerstoerer: {
    de: 'Der Gesandte Allahs ﷺ sagte: „Gedenkt oft des Zerstörers der Genüsse.“ – gemeint ist der Tod.',
    src: 'Tirmidhi 2307 (hasan)',
  },
  sakra: {
    ar: 'وَجَاءَتْ سَكْرَةُ الْمَوْتِ بِالْحَقِّ ۖ ذَٰلِكَ مَا كُنتَ مِنْهُ تَحِيدُ',
    de: '„Und die Trunkenheit des Todes kommt mit der Wahrheit. Das ist es, dem du immer ausweichen wolltest.“',
    src: 'Qāf 50:19',
  },
  sakaratProphet: {
    ar: 'لَا إِلَهَ إِلَّا اللَّهُ، إِنَّ لِلْمَوْتِ سَكَرَاتٍ',
    de: 'In seiner Todesstunde tauchte der Gesandte Allahs ﷺ seine Hände in ein Gefäß mit Wasser, strich sich über das Gesicht und sagte: „Lā ilāha illā Llāh – der Tod hat wahrlich seine Trunkenheiten.“',
    src: 'Bukhari 6510',
  },
  taraqi: {
    ar: 'كَلَّا إِذَا بَلَغَتِ التَّرَاقِيَ ﴿٢٦﴾ وَقِيلَ مَنْ ۜ رَاقٍ ﴿٢٧﴾ وَظَنَّ أَنَّهُ الْفِرَاقُ ﴿٢٨﴾ وَالْتَفَّتِ السَّاقُ بِالسَّاقِ ﴿٢٩﴾ إِلَىٰ رَبِّكَ يَوْمَئِذٍ الْمَسَاقُ ﴿٣٠﴾',
    de: '„Keineswegs! Wenn sie die Schlüsselbeine erreicht und gesagt wird: ‚Wer kann ihn noch heilen?‘, und er überzeugt ist, dass es der Abschied ist, und sich Bein an Bein schmiegt – zu deinem Herrn wird an jenem Tag das Treiben sein.“',
    src: 'Al-Qiyāma 75:26–30',
  },
  talqin: { style: 'whisper', ar: 'لَا إِلَهَ إِلَّا اللَّهُ', de: '„Lā ilāha illā Llāh …“' },
  talqinHad: {
    ar: 'لَقِّنُوا مَوْتَاكُمْ لَا إِلَهَ إِلَّا اللَّهُ',
    de: 'Der Gesandte Allahs ﷺ sagte: „Sprecht euren Sterbenden ‚Lā ilāha illā Llāh‘ vor.“',
    src: 'Muslim 916',
  },
  letztesWort: {
    ar: 'مَنْ كَانَ آخِرُ كَلَامِهِ لَا إِلَهَ إِلَّا اللَّهُ دَخَلَ الْجَنَّةَ',
    de: '„Wessen letztes Wort ‚Lā ilāha illā Llāh‘ ist, der geht ins Paradies ein.“',
    src: 'Abu Dawud 3116',
  },
  hulqum: {
    ar: 'فَلَوْلَا إِذَا بَلَغَتِ الْحُلْقُومَ ﴿٨٣﴾ وَأَنتُمْ حِينَئِذٍ تَنظُرُونَ ﴿٨٤﴾ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنكُمْ وَلَٰكِن لَّا تُبْصِرُونَ ﴿٨٥﴾',
    de: '„Wenn sie doch – wenn sie die Kehle erreicht und ihr in diesem Augenblick zuschaut – Wir sind ihm näher als ihr, doch ihr seht es nicht.“',
    src: 'Al-Wāqiʿa 56:83–85',
  },
  ghita: {
    ar: 'لَّقَدْ كُنتَ فِي غَفْلَةٍ مِّنْ هَٰذَا فَكَشَفْنَا عَنكَ غِطَاءَكَ فَبَصَرُكَ الْيَوْمَ حَدِيدٌ',
    de: '„Du warst dessen gegenüber achtlos. Nun haben Wir dir deine Hülle weggenommen, und so ist dein Blick heute scharf.“',
    src: 'Qāf 50:22',
  },
  abdMumin: {
    style: 'title',
    ar: 'إِنَّ الْعَبْدَ الْمُؤْمِنَ إِذَا كَانَ فِي انْقِطَاعٍ مِنَ الدُّنْيَا وَإِقْبَالٍ مِنَ الْآخِرَةِ…',
    de: '„Wenn der gläubige Diener sich von der Welt löst und dem Jenseits zuwendet …“',
  },
  engelHerab: {
    de: 'Der Gesandte Allahs ﷺ sagte: „Es steigen Engel vom Himmel zu ihm herab, mit weißen Gesichtern, als wären ihre Gesichter die Sonne. Bei ihnen ist ein Leichentuch aus dem Paradies und Duft aus dem Paradies. Sie setzen sich zu ihm, so weit das Auge reicht.“',
    src: BARA,
  },
  malakA: {
    ar: 'يَا أَيَّتُهَا النَّفْسُ الطَّيِّبَةُ، اخْرُجِي إِلَى مَغْفِرَةٍ مِنَ اللَّهِ وَرِضْوَانٍ',
    de: '„Dann kommt der Engel des Todes, setzt sich an sein Kopfende und sagt: ‚O gute Seele, komm heraus zu Vergebung von Allah und Wohlgefallen.‘“',
    src: BARA,
  },
  salamA: {
    ar: 'الَّذِينَ تَتَوَفَّاهُمُ الْمَلَائِكَةُ طَيِّبِينَ ۙ يَقُولُونَ سَلَامٌ عَلَيْكُمُ ادْخُلُوا الْجَنَّةَ بِمَا كُنتُمْ تَعْمَلُونَ',
    de: '„Diejenigen, die die Engel abberufen, während sie gut sind; sie sagen: ‚Friede sei mit euch! Tretet ins Paradies ein für das, was ihr zu tun pflegtet.‘“',
    src: 'An-Naḥl 16:32',
  },
  blickFolgt: {
    style: 'whisper',
    ar: 'إِنَّ الرُّوحَ إِذَا قُبِضَ تَبِعَهُ الْبَصَرُ',
    de: '„Wenn die Seele genommen wird, folgt ihr der Blick.“',
    src: 'Muslim 920',
  },
  fliesst: {
    de: '„Da tritt sie heraus und fließt, wie der Tropfen aus der Öffnung des Wasserschlauchs fließt … und es strömt von ihr aus wie der beste Duft von Moschus auf dem Antlitz der Erde.“',
    src: BARA,
  },
  mutmainna: {
    ar: 'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ﴿٢٧﴾ ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً ﴿٢٨﴾ فَادْخُلِي فِي عِبَادِي ﴿٢٩﴾ وَادْخُلِي جَنَّتِي ﴿٣٠﴾',
    de: '„O du ruhige Seele, kehre zurück zu deinem Herrn, zufrieden und mit Wohlgefallen aufgenommen. Tritt ein unter Meine Diener, und tritt ein in Mein Paradies.“',
    src: 'Al-Fajr 89:27–30',
  },
  aufstiegHinweis: {
    style: 'hint',
    de: 'Im Prototyp folgt hier der Sprung zum Totengebet.\nWeg B beim Sterben und der Aufstieg durch die Himmel (Akt II) kommen in der fertigen Fassung.',
  },

  // ======================= TOTENGEBET =======================
  janazaTitel: { style: 'title', ar: 'صَلَاةُ الْجَنَازَةِ', de: 'Das Totengebet' },
  kafan: {
    ar: 'الْبَسُوا مِنْ ثِيَابِكُمُ الْبَيَاضَ فَإِنَّهَا مِنْ خَيْرِ ثِيَابِكُمْ، وَكَفِّنُوا فِيهَا مَوْتَاكُمْ',
    de: 'Sie waschen ihn und hüllen ihn in Weiß. Der Gesandte Allahs ﷺ sagte: „Tragt von euren Kleidern die weißen, denn sie gehören zu euren besten Kleidern, und hüllt eure Toten darin ein.“',
    src: 'Tirmidhi 994 · Abu Dawud 3878',
  },
  takbir: { style: 'answer', ar: 'اللَّهُ أَكْبَرُ', de: '„Allāhu akbar“' },
  vierzig: {
    ar: 'مَا مِنْ رَجُلٍ مُسْلِمٍ يَمُوتُ فَيَقُومُ عَلَى جَنَازَتِهِ أَرْبَعُونَ رَجُلًا لَا يُشْرِكُونَ بِاللَّهِ شَيْئًا إِلَّا شَفَّعَهُمُ اللَّهُ فِيهِ',
    de: 'Der Gesandte Allahs ﷺ sagte: „Es gibt keinen muslimischen Mann, der stirbt und für dessen Totengebet vierzig Männer stehen, die Allah nichts beigesellen, ohne dass Allah ihre Fürsprache für ihn annimmt.“',
    src: 'Muslim 948',
  },
  salamJanaza: { style: 'answer', ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', de: '„As-salāmu ʿalaikum wa raḥmatu Llāh“' },
  asriu: {
    de: 'Der Gesandte Allahs ﷺ sagte: „Beeilt euch mit dem Toten. Ist er rechtschaffen, so ist es Gutes, zu dem ihr ihn vorausschickt. Ist er es nicht, so ist es Übles, das ihr von euren Nacken ablegt.“',
    src: 'Bukhari 1315',
  },
  qaddimuni: {
    ar: 'فَإِنْ كَانَتْ صَالِحَةً قَالَتْ: قَدِّمُونِي قَدِّمُونِي، وَإِنْ كَانَتْ غَيْرَ صَالِحَةٍ قَالَتْ: يَا وَيْلَهَا، أَيْنَ يَذْهَبُونَ بِهَا؟',
    de: '„Wenn die Männer den Toten auf ihre Schultern nehmen: War er rechtschaffen, sagt er: ‚Bringt mich voran! Bringt mich voran!‘ War er es nicht, sagt er: ‚Wehe ihm! Wohin bringt ihr ihn?‘ Seine Stimme hört alles außer dem Menschen – würde der Mensch sie hören, er fiele bewusstlos nieder.“',
    src: 'Bukhari 1316',
  },

  // ---------- Einstieg ----------
  aktTitel: {
    style: 'title',
    ar: 'الْقَبْرُ',
    de: 'Akt III · Das Grab',
  },
  ersteStation: {
    ar: 'إِنَّ الْقَبْرَ أَوَّلُ مَنْزِلٍ مِنْ مَنَازِلِ الْآخِرَةِ، فَإِنْ نَجَا مِنْهُ فَمَا بَعْدَهُ أَيْسَرُ مِنْهُ، وَإِنْ لَمْ يَنْجُ مِنْهُ فَمَا بَعْدَهُ أَشَدُّ مِنْهُ',
    de: 'Der Gesandte Allahs ﷺ sagte: „Das Grab ist die erste Station des Jenseits. Wer aus ihr gerettet wird, für den ist das, was danach kommt, leichter. Und wer aus ihr nicht gerettet wird, für den ist das, was danach kommt, schwerer.“',
    src: 'Tirmidhi 2308 (hasan)',
  },

  // ---------- 3.0 Beerdigung ----------
  dreiFolgen: {
    ar: 'يَتْبَعُ الْمَيِّتَ ثَلَاثَةٌ، فَيَرْجِعُ اثْنَانِ وَيَبْقَى مَعَهُ وَاحِدٌ: يَتْبَعُهُ أَهْلُهُ وَمَالُهُ وَعَمَلُهُ، فَيَرْجِعُ أَهْلُهُ وَمَالُهُ، وَيَبْقَى عَمَلُهُ',
    de: 'Der Gesandte Allahs ﷺ sagte: „Dem Toten folgen drei: seine Familie, sein Besitz und seine Taten. Zwei kehren zurück, und einer bleibt bei ihm. Seine Familie und sein Besitz kehren zurück, und seine Taten bleiben.“',
    src: 'Bukhari 6514 · Muslim 2960',
  },
  sandalen: {
    style: 'whisper',
    ar: 'إِنَّ الْعَبْدَ إِذَا وُضِعَ فِي قَبْرِهِ وَتَوَلَّى عَنْهُ أَصْحَابُهُ، وَإِنَّهُ لَيَسْمَعُ قَرْعَ نِعَالِهِمْ',
    de: '„Wenn der Diener in sein Grab gelegt wird und seine Gefährten sich abwenden und fortgehen, dann hört er das Klappern ihrer Sandalen.“',
    src: 'Bukhari 1338 · Muslim 2870',
  },
  barzakh: {
    ar: 'وَمِن وَرَائِهِم بَرْزَخٌ إِلَىٰ يَوْمِ يُبْعَثُونَ',
    de: '„Und hinter ihnen ist eine Schranke bis zu dem Tag, an dem sie auferweckt werden.“',
    src: 'Al-Muʾminūn 23:100',
  },

  // ---------- 3A Der gläubige Diener ----------
  titelA: {
    style: 'title',
    ar: 'إِنَّ الْعَبْدَ الْمُؤْمِنَ…',
    de: 'Der gläubige Diener',
  },
  rueckgabeA: {
    ar: 'فَتُعَادُ رُوحُهُ فِي جَسَدِهِ، فَيَأْتِيهِ مَلَكَانِ فَيُجْلِسَانِهِ فَيَقُولَانِ لَهُ',
    de: '„Dann wird seine Seele in seinen Körper zurückgegeben. Es kommen zwei Engel zu ihm, setzen ihn auf und sagen zu ihm:“',
    src: BARA,
  },
  fragenA: [
    [
      { style: 'question', ar: 'مَنْ رَبُّكَ؟', de: '„Wer ist dein Herr?“', src: BARA },
      { style: 'answer', ar: 'رَبِّيَ اللَّهُ', de: '„Mein Herr ist Allah.“' },
    ],
    [
      { style: 'question', ar: 'مَا دِينُكَ؟', de: '„Was ist deine Religion?“', src: BARA },
      { style: 'answer', ar: 'دِينِيَ الْإِسْلَامُ', de: '„Meine Religion ist der Islam.“' },
    ],
    [
      { style: 'question', ar: 'مَا هَذَا الرَّجُلُ الَّذِي بُعِثَ فِيكُمْ؟', de: '„Wer ist dieser Mann, der unter euch gesandt wurde?“', src: BARA },
      { style: 'answer', ar: 'هُوَ رَسُولُ اللَّهِ ﷺ', de: '„Er ist der Gesandte Allahs ﷺ.“' },
    ],
    [
      { style: 'question', ar: 'وَمَا عِلْمُكَ؟', de: '„Und woher weißt du das?“', src: BARA },
      { style: 'answer', ar: 'قَرَأْتُ كِتَابَ اللَّهِ، فَآمَنْتُ بِهِ وَصَدَّقْتُ', de: '„Ich habe das Buch Allahs gelesen, daran geglaubt und es für wahr gehalten.“' },
    ],
  ],
  festesWort: {
    ar: 'يُثَبِّتُ اللَّهُ الَّذِينَ آمَنُوا بِالْقَوْلِ الثَّابِتِ فِي الْحَيَاةِ الدُّنْيَا وَفِي الْآخِرَةِ',
    de: '„Allah festigt diejenigen, die glauben, mit dem festen Wort im diesseitigen Leben und im Jenseits.“',
    src: 'Ibrāhīm 14:27 · vgl. Bukhari 1369',
  },
  rufA: {
    ar: 'أَنْ صَدَقَ عَبْدِي، فَأَفْرِشُوهُ مِنَ الْجَنَّةِ، وَأَلْبِسُوهُ مِنَ الْجَنَّةِ، وَافْتَحُوا لَهُ بَابًا إِلَى الْجَنَّةِ',
    de: '„Da ruft ein Rufer vom Himmel: ‚Mein Diener hat die Wahrheit gesagt. Breitet ihm aus dem Paradies aus, kleidet ihn aus dem Paradies, und öffnet ihm ein Tor zum Paradies.‘“',
    src: BARA,
  },
  weiteA: {
    ar: 'فَيَأْتِيهِ مِنْ رَوْحِهَا وَطِيبِهَا، وَيُفْسَحُ لَهُ فِي قَبْرِهِ مَدَّ بَصَرِهِ',
    de: '„Da kommt zu ihm von seinem Wohlgeruch und seinem Duft, und sein Grab wird ihm geweitet, so weit sein Blick reicht.“',
    src: BARA,
  },
  platzA: {
    de: 'Der Gesandte Allahs ﷺ sagte: „Wenn einer von euch stirbt, wird ihm sein Platz morgens und abends gezeigt. Gehört er zu den Leuten des Paradieses, dann von den Leuten des Paradieses. Und es wird gesagt: ‚Das ist dein Platz, bis Allah dich am Tag der Auferstehung auferweckt.‘“',
    src: 'Bukhari 1379 · Muslim 2866',
  },
  gefaehrteA: [
    {
      ar: 'وَيَأْتِيهِ رَجُلٌ حَسَنُ الْوَجْهِ، حَسَنُ الثِّيَابِ، طَيِّبُ الرِّيحِ، فَيَقُولُ:',
      de: '„Und es kommt zu ihm ein Mann mit schönem Gesicht, schönen Kleidern und gutem Duft und sagt:“',
      src: BARA,
    },
    {
      style: 'question',
      ar: 'أَبْشِرْ بِالَّذِي يَسُرُّكَ، هَذَا يَوْمُكَ الَّذِي كُنْتَ تُوعَدُ',
      de: '„Freue dich über das, was dich froh macht. Das ist dein Tag, der dir versprochen wurde.“',
      src: BARA,
    },
    {
      style: 'answer',
      ar: 'مَنْ أَنْتَ؟ فَوَجْهُكَ الْوَجْهُ يَجِيءُ بِالْخَيْرِ',
      de: '„Wer bist du? Dein Gesicht ist ein Gesicht, das Gutes bringt.“',
    },
    {
      style: 'question',
      ar: 'أَنَا عَمَلُكَ الصَّالِحُ',
      de: '„Ich bin deine guten Taten.“',
      src: BARA,
    },
    {
      style: 'answer',
      ar: 'رَبِّ أَقِمِ السَّاعَةَ، حَتَّى أَرْجِعَ إِلَى أَهْلِي وَمَالِي',
      de: '„Herr, lass die Stunde anbrechen, damit ich zu meiner Familie und meinem Besitz zurückkehre.“',
    },
  ],
  brautA: {
    ar: 'نَمْ كَنَوْمَةِ الْعَرُوسِ الَّذِي لَا يُوقِظُهُ إِلَّا أَحَبُّ أَهْلِهِ إِلَيْهِ',
    de: 'In einer anderen Überlieferung wird ihm gesagt: „Schlafe wie der Schlaf des Bräutigams, den nur der Liebste seiner Familie weckt.“',
    src: 'Tirmidhi 1071 (hasan)',
  },

  // ---------- Übergang ----------
  titelB: {
    style: 'title',
    ar: 'وَإِنَّ الْعَبْدَ الْكَافِرَ…',
    de: 'Und der ungläubige Diener …',
  },

  // ---------- 3B Der ungläubige Diener ----------
  rueckgabeB: {
    ar: 'فَتُعَادُ رُوحُهُ فِي جَسَدِهِ، وَيَأْتِيهِ مَلَكَانِ فَيُجْلِسَانِهِ فَيَقُولَانِ لَهُ',
    de: '„Dann wird seine Seele in seinen Körper zurückgegeben, und es kommen zwei Engel zu ihm, setzen ihn auf und sagen zu ihm:“',
    src: BARA,
  },
  fragenB: [
    [
      { style: 'question', ar: 'مَنْ رَبُّكَ؟', de: '„Wer ist dein Herr?“', src: BARA },
      { style: 'answer', ar: 'هَاهْ هَاهْ، لَا أَدْرِي', de: '„Hāh … hāh … ich weiß nicht.“', colorAr: '#b9b2a6' },
    ],
    [
      { style: 'question', ar: 'مَا دِينُكَ؟', de: '„Was ist deine Religion?“', src: BARA },
      { style: 'answer', ar: 'هَاهْ هَاهْ، لَا أَدْرِي', de: '„Hāh … hāh … ich weiß nicht.“', colorAr: '#b9b2a6' },
    ],
    [
      { style: 'question', ar: 'مَا هَذَا الرَّجُلُ الَّذِي بُعِثَ فِيكُمْ؟', de: '„Wer ist dieser Mann, der unter euch gesandt wurde?“', src: BARA },
      { style: 'answer', ar: 'هَاهْ هَاهْ، لَا أَدْرِي', de: '„Hāh … hāh … ich weiß nicht.“', colorAr: '#b9b2a6' },
    ],
  ],
  laDarayta: {
    ar: 'لَا دَرَيْتَ وَلَا تَلَيْتَ',
    de: 'In einer anderen Überlieferung sagt er: „Ich weiß nicht. Ich habe gesagt, was die Leute sagten.“ Da wird ihm gesagt: „Du hast weder gewusst, noch bist du (den Wissenden) gefolgt.“',
    src: 'Bukhari 1374',
  },
  rufB: {
    ar: 'أَنْ كَذَبَ، فَافْرِشُوا لَهُ مِنَ النَّارِ، وَافْتَحُوا لَهُ بَابًا إِلَى النَّارِ',
    de: '„Da ruft ein Rufer vom Himmel: ‚Er hat gelogen. Breitet ihm aus dem Feuer aus, und öffnet ihm ein Tor zum Feuer.‘“',
    src: BARA,
  },
  engeB: {
    ar: 'فَيَأْتِيهِ مِنْ حَرِّهَا وَسَمُومِهَا، وَيُضَيَّقُ عَلَيْهِ قَبْرُهُ حَتَّى تَخْتَلِفَ فِيهِ أَضْلَاعُهُ',
    de: '„Da kommt zu ihm von ihrer Hitze und ihrem glühenden Wind, und sein Grab wird ihm eng gemacht, bis seine Rippen ineinandergreifen.“',
    src: BARA,
  },
  hinweisEnge: {
    style: 'hint',
    de: 'Es folgt eine enge Szene (ca. 6 Sekunden).\nSeitentaste gedrückt halten, um sie zu überspringen.',
  },
  gefaehrteB: [
    {
      ar: 'وَيَأْتِيهِ رَجُلٌ قَبِيحُ الْوَجْهِ، قَبِيحُ الثِّيَابِ، مُنْتِنُ الرِّيحِ، فَيَقُولُ:',
      de: '„Und es kommt zu ihm ein Mann mit hässlichem Gesicht, hässlichen Kleidern und üblem Geruch und sagt:“',
      src: BARA,
    },
    {
      style: 'question',
      ar: 'أَبْشِرْ بِالَّذِي يَسُوءُكَ، هَذَا يَوْمُكَ الَّذِي كُنْتَ تُوعَدُ',
      de: '„Sieh dem entgegen, was dir Übles bringt. Das ist dein Tag, der dir versprochen wurde.“',
      src: BARA,
    },
    {
      style: 'answer',
      ar: 'مَنْ أَنْتَ؟ فَوَجْهُكَ الْوَجْهُ يَجِيءُ بِالشَّرِّ',
      de: '„Wer bist du? Dein Gesicht ist ein Gesicht, das Böses bringt.“',
      colorAr: '#b9b2a6',
    },
    {
      style: 'question',
      ar: 'أَنَا عَمَلُكَ الْخَبِيثُ',
      de: '„Ich bin deine schlechten Taten.“',
      src: BARA,
    },
    {
      style: 'answer',
      ar: 'رَبِّ لَا تُقِمِ السَّاعَةَ',
      de: '„Herr, lass die Stunde nicht anbrechen!“',
      colorAr: '#b9b2a6',
    },
  ],
  schreiB: {
    ar: 'وَيُضْرَبُ بِمَطَارِقَ مِنْ حَدِيدٍ ضَرْبَةً، فَيَصِيحُ صَيْحَةً يَسْمَعُهَا مَنْ يَلِيهِ غَيْرَ الثَّقَلَيْنِ',
    de: 'Der Gesandte Allahs ﷺ sagte: „… dann wird er mit einem Hammer aus Eisen geschlagen, einem Schlag, und er schreit einen Schrei, den alles hört, was um ihn herum ist – außer den Menschen und den Dschinn.“',
    src: 'Bukhari 1374',
  },
  vorgefuehrtB: {
    ar: 'النَّارُ يُعْرَضُونَ عَلَيْهَا غُدُوًّا وَعَشِيًّا ۖ وَيَوْمَ تَقُومُ السَّاعَةُ أَدْخِلُوا آلَ فِرْعَوْنَ أَشَدَّ الْعَذَابِ',
    de: '„Das Feuer – ihm werden sie morgens und abends vorgeführt. Und am Tag, an dem die Stunde anbricht: ‚Lasst die Leute Pharaos in die strengste Strafe eingehen!‘“',
    src: 'Ghāfir 40:46',
  },

  // ---------- Ende ----------
  ende: {
    style: 'title',
    de: 'Ende des Prototyps · Akt III\n\nTrigger drücken, um neu zu starten.',
  },
  pruefhinweis: {
    style: 'hint',
    de: 'Prototyp · Alle Texte im Entwurf, noch nicht vom Gelehrten geprüft.\nStimmen und Rezitation folgen in der Produktion.',
  },
};
