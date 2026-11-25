// Texte für Akt III – Das Grab.
// Quelle: drehbuch/DREHBUCH.md. Alle arabischen Texte und Übersetzungen sind Entwurf
// und müssen vor der Veröffentlichung vom Gelehrten geprüft werden (GELEHRTEN-PRUEFUNG.md).
//
// style: 'title' | 'quote' (Standard) | 'whisper' | 'question' | 'answer' | 'hint'

const BARA = 'Abu Dawud 4753 · Ahmad 18534';

export const TX = {
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
