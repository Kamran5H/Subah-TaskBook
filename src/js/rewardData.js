// Curated Reward Library for Subah Task Book
// Categories: Naat, Qawwali, Soulful Melody, Daily Mashwara (Wisdom), Inspiring Reading, Mindful Reel
//
// Every youtubeId was verified TWICE: (1) it exists (YouTube oEmbed 200), and
// (2) it is actually embeddable - loaded inside the real app with no onError.
// Note: most official-label uploads return error 150 (embedding disabled by the
// owner), so they are deliberately avoided here. Each entry also carries a
// searchUrl - a durable fallback that cannot 404 if a video is ever removed.

const DEFAULT_REWARDS = [
  {
    "id": "naat-01",
    "category": "naat",
    "categoryLabel": "🕌 Soulful Naat",
    "title": "Faslon Ko Takalluf Hai Hum Se Agar",
    "artist": "Qari Waheed Zafar Qasmi",
    "duration": "6 mins",
    "youtubeId": "q4QH4JAMbEc",
    "externalUrl": "https://www.youtube.com/watch?v=q4QH4JAMbEc",
    "description": "A timeless, soul-stirring rendition that fills the heart with profound tranquility and yearning for Madinah Munawwarah.",
    "searchUrl": "https://www.youtube.com/results?search_query=Faslon%20Ko%20Takalluf%20Hai%20Hum%20Se%20Agar%20Qari%20Waheed%20Zafar%20Qasmi"
  },
  {
    "id": "naat-02",
    "category": "naat",
    "categoryLabel": "🕌 Soulful Naat",
    "title": "Qasida Burda Sharif (Mawlaya Salli)",
    "artist": "Traditional | The City School",
    "duration": "7 mins",
    "youtubeId": "QXGuAwrfSz8",
    "externalUrl": "https://www.youtube.com/watch?v=QXGuAwrfSz8",
    "description": "The classic poem of praise composed by Imam al-Busiri, recited with supreme peace and spiritual elevation.",
    "searchUrl": "https://www.youtube.com/results?search_query=Qasida%20Burda%20Sharif%20(Mawlaya%20Salli)%20Traditional%20%7C%20The%20City%20School"
  },
  {
    "id": "naat-03",
    "category": "naat",
    "categoryLabel": "🕌 Soulful Naat",
    "title": "Mustafa Jaan-e-Rehmat Pe Lakhon Salaam",
    "artist": "Bossmenn feat. Atif Aslam",
    "duration": "6 mins",
    "youtubeId": "7Im-i3GQvVc",
    "externalUrl": "https://www.youtube.com/watch?v=7Im-i3GQvVc",
    "description": "Heartfelt Salawat sending millions of blessings upon the Prophet ﷺ. An instant cleanser for mental fatigue.",
    "searchUrl": "https://www.youtube.com/results?search_query=Mustafa%20Jaan-e-Rehmat%20Pe%20Lakhon%20Salaam%20Bossmenn%20feat.%20Atif%20Aslam"
  },
  {
    "id": "naat-04",
    "category": "naat",
    "categoryLabel": "🕌 Soulful Naat",
    "title": "Karam Mangta Hoon, Ataa Mangta Hoon",
    "artist": "Devotional Recitation",
    "duration": "7 mins",
    "youtubeId": "EjRV1Kq25qA",
    "externalUrl": "https://www.youtube.com/watch?v=EjRV1Kq25qA",
    "description": "A deeply emotional Munajaat pleading for divine mercy, compassion, and pardon from worries.",
    "searchUrl": "https://www.youtube.com/results?search_query=Karam%20Mangta%20Hoon%2C%20Ataa%20Mangta%20Hoon%20Devotional%20Recitation"
  },
  {
    "id": "naat-05",
    "category": "naat",
    "categoryLabel": "🕌 Soulful Naat",
    "title": "Main Tou Panjtan Ka Ghulam Hoon",
    "artist": "Syed Fasihuddin Soharwardi (Live)",
    "duration": "5 mins",
    "youtubeId": "UMLFblij8Wo",
    "externalUrl": "https://www.youtube.com/watch?v=UMLFblij8Wo",
    "description": "Soul-elevating devotion that brings an aura of warmth, devotion, and steadfastness to your day.",
    "searchUrl": "https://www.youtube.com/results?search_query=Main%20Tou%20Panjtan%20Ka%20Ghulam%20Hoon%20Syed%20Fasihuddin%20Soharwardi%20(Live)"
  },
  {
    "id": "qawwali-01",
    "category": "qawwali",
    "categoryLabel": "🎶 Legendary Qawwali",
    "title": "Tajdar-e-Haram Ae Shehenshah-e-Deen",
    "artist": "Sabri Brothers",
    "duration": "8 mins",
    "youtubeId": "_m7fAatL03g",
    "externalUrl": "https://www.youtube.com/watch?v=_m7fAatL03g",
    "description": "The crown jewel of traditional Sufi Qawwali. Energetic yet immensely reverent rhythms that banish lethargy.",
    "searchUrl": "https://www.youtube.com/results?search_query=Tajdar-e-Haram%20Ae%20Shehenshah-e-Deen%20Sabri%20Brothers"
  },
  {
    "id": "qawwali-02",
    "category": "qawwali",
    "categoryLabel": "🎶 Legendary Qawwali",
    "title": "Chaap Tilak Sab Chheen Li Mose Naina Milaye Ke",
    "artist": "Ustad Nusrat Fateh Ali Khan",
    "duration": "7 mins",
    "youtubeId": "JrwqScfd0Dk",
    "externalUrl": "https://www.youtube.com/watch?v=JrwqScfd0Dk",
    "description": "Hazrat Amir Khusro's celebrated mystical poem of divine ecstasy and selfless devotion to the beloved master.",
    "searchUrl": "https://www.youtube.com/results?search_query=Chaap%20Tilak%20Sab%20Chheen%20Li%20Mose%20Naina%20Milaye%20Ke%20Ustad%20Nusrat%20Fateh%20Ali%20Khan"
  },
  {
    "id": "qawwali-03",
    "category": "qawwali",
    "categoryLabel": "🎶 Legendary Qawwali",
    "title": "Dam Mast Qalandar Mast Mast",
    "artist": "Ustad Nusrat Fateh Ali Khan",
    "duration": "6 mins",
    "youtubeId": "v38w5djsbXM",
    "externalUrl": "https://www.youtube.com/watch?v=v38w5djsbXM",
    "description": "Electrifying spiritual tempo honoring Lal Shahbaz Qalandar. Awakens the senses with joyous resonance.",
    "searchUrl": "https://www.youtube.com/results?search_query=Dam%20Mast%20Qalandar%20Mast%20Mast%20Ustad%20Nusrat%20Fateh%20Ali%20Khan"
  },
  {
    "id": "qawwali-04",
    "category": "qawwali",
    "categoryLabel": "🎶 Legendary Qawwali",
    "title": "Woh Hata Rahe Hain Parda Sar-e-Aam Dheere Dheere",
    "artist": "Ustad Nusrat Fateh Ali Khan",
    "duration": "8 mins",
    "youtubeId": "_bpjscGYyFs",
    "externalUrl": "https://www.youtube.com/watch?v=_bpjscGYyFs",
    "description": "Exquisite ghazal-qawwali blend with mesmerizing harmonium play and nuanced vocal improvisation.",
    "searchUrl": "https://www.youtube.com/results?search_query=Woh%20Hata%20Rahe%20Hain%20Parda%20Sar-e-Aam%20Dheere%20Dheere%20Ustad%20Nusrat%20Fateh%20Ali%20Khan"
  },
  {
    "id": "qawwali-05",
    "category": "qawwali",
    "categoryLabel": "🎶 Legendary Qawwali",
    "title": "Allah Hoo Allah Hoo (Live 1993)",
    "artist": "Ustad Nusrat Fateh Ali Khan",
    "duration": "6 mins",
    "youtubeId": "cj7roem9NRc",
    "externalUrl": "https://www.youtube.com/watch?v=cj7roem9NRc",
    "description": "A transcendent live rendition - the purest expression of divine remembrance in qawwali.",
    "searchUrl": "https://www.youtube.com/results?search_query=Allah%20Hoo%20Allah%20Hoo%20(Live%201993)%20Ustad%20Nusrat%20Fateh%20Ali%20Khan"
  },
  {
    "id": "melody-01",
    "category": "melody",
    "categoryLabel": "🎵 Soulful Melody",
    "title": "Ottoman Sufi Music - Turkish Ney Flute",
    "artist": "Servet",
    "duration": "5 mins",
    "youtubeId": "3ATc6DwYyTQ",
    "externalUrl": "https://www.youtube.com/watch?v=3ATc6DwYyTQ",
    "description": "Deep, breathy tones of the hollow reed Ney flute symbolizing the soul's yearning for eternal stillness.",
    "searchUrl": "https://www.youtube.com/results?search_query=Ottoman%20Sufi%20Music%20-%20Turkish%20Ney%20Flute%20Servet"
  },
  {
    "id": "melody-02",
    "category": "melody",
    "categoryLabel": "🎵 Soulful Melody",
    "title": "Acoustic Guitar in the Rain",
    "artist": "MONOMAN",
    "duration": "6 mins",
    "youtubeId": "Mf6NCLMLQL8",
    "externalUrl": "https://www.youtube.com/watch?v=Mf6NCLMLQL8",
    "description": "Gentle acoustic plucking overlaid with distant gentle rain to relieve all cognitive strain.",
    "searchUrl": "https://www.youtube.com/results?search_query=Acoustic%20Guitar%20in%20the%20Rain%20MONOMAN"
  },
  {
    "id": "melody-03",
    "category": "melody",
    "categoryLabel": "🎵 Soulful Melody",
    "title": "Bamboo Flute Meditation",
    "artist": "Tiny Lotus",
    "duration": "5 mins",
    "youtubeId": "6ixhN9umyp4",
    "externalUrl": "https://www.youtube.com/watch?v=6ixhN9umyp4",
    "description": "Warm, mellow piano chords wrapped in vinyl warmth to center your mind before your next accomplishment.",
    "searchUrl": "https://www.youtube.com/results?search_query=Bamboo%20Flute%20Meditation%20Tiny%20Lotus"
  },
  {
    "id": "mashwara-01",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "The Golden Rule of Barakah: Doing Less with Full Heart",
    "author": "Sage Advice for Modern Days",
    "duration": "3 mins",
    "content": "### 🌟 Barakah Over Hurry\nTrue productivity is never about cramming twenty tasks into a state of chronic panic. When you rush, you invite anxiety, make careless errors, and strip your soul of peace.\n\n**The Mashwara:**\n1. Work on ONE single task with complete, sincere presence as if the rest of the world has stopped.\n2. Begin everything with *Bismillah* and an intention to benefit your family, community, or your inner growth.\n3. Once completed, pause for two quiet breaths before jumping to the next.\n\n> *\"Do noble things quietly, and the universe will amplify the outcome.\"*",
    "description": "A quick mental realignment on how slowing down produces superior work and peace.",
    "searchUrl": "https://www.youtube.com/results?search_query=The%20Golden%20Rule%20of%20Barakah%3A%20Doing%20Less%20with%20Full%20Heart%20Sage%20Advice%20for%20Modern%20Days"
  },
  {
    "id": "mashwara-02",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "The 10-Minute Reset: Guarding Your Inner Fortress",
    "author": "Mindful Focus Protocol",
    "duration": "3 mins",
    "content": "### 🛡️ Guarding Your Cognitive Sanctity\nWhen your laptop screen and work demands start making your temples throb, do not reach for mindless social media scrolling. That only adds noise to an already congested mind.\n\n**The Mashwara:**\n- Stand up, look out the window at the distant horizon or sky for 60 seconds.\n- Drink a cool glass of water sip by sip.\n- Remember: **Urgency is often an illusion.** You have enough time for what truly matters when you stop entertaining trivial fires.",
    "description": "Practical advice on preventing afternoon burnout and cognitive overload.",
    "searchUrl": "https://www.youtube.com/results?search_query=The%2010-Minute%20Reset%3A%20Guarding%20Your%20Inner%20Fortress%20Mindful%20Focus%20Protocol"
  },
  {
    "id": "mashwara-03",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Patience (Sabr) is Not Waiting — It is How You Behave While Growing",
    "author": "Timeless Wisdom",
    "duration": "4 mins",
    "content": "### 🌱 The Secret of Silent Growth\nThe bamboo tree spends four full years hidden under dark mud, spreading deep invisible roots without a single sprout above surface. In its fifth year, it grows 90 feet in six weeks!\n\n**The Mashwara:**\nNever despise small, unglamorous daily tasks. The consistency you are showing today by logging your five tasks is your root system. The world will see the towering tree later; honor the soil today.",
    "description": "An uplifting perspective for anyone feeling that results take too long.",
    "searchUrl": "https://www.youtube.com/results?search_query=Patience%20(Sabr)%20is%20Not%20Waiting%20%E2%80%94%20It%20is%20How%20You%20Behave%20While%20Growing%20Timeless%20Wisdom"
  },
  {
    "id": "reading-01",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Parable of the Clay Jar and Fragrant Earth",
    "author": "Sheikh Saadi Shirazi (Gulistan)",
    "duration": "4 mins",
    "content": "### 🌸 The Scent of Good Company\nA traveler picked up a piece of ordinary scented clay in a bathhouse. Its fragrance was so delightful that it scented the entire chamber.\n\nThe traveler asked:\n*\"Are you musk or ambergris? For I am captivated by your perfume!\"*\n\nThe humble clay answered:\n*\"I was merely a lowly lump of soil. But for some days, I sat at the feet of a blooming rose. The sweet scent of my companion soaked into my heart; otherwise, I would remain the plain dirt that I am.\"*\n\n**Reflect:**\nWhose energy, words, and thoughts are you soaking in today? Choose companionship and media that leave you fragrant with gratitude and wisdom.",
    "description": "Saadi's masterclass on how your daily environment shapes your mind.",
    "searchUrl": "https://www.youtube.com/results?search_query=The%20Parable%20of%20the%20Clay%20Jar%20and%20Fragrant%20Earth%20Sheikh%20Saadi%20Shirazi%20(Gulistan)"
  },
  {
    "id": "reading-02",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Mexican Fisherman and the Wall Street Banker",
    "author": "Classic Life Tale",
    "duration": "4 mins",
    "content": "### ⛵ What Are You Rushing Towards?\nAn investment banker on vacation observed a fisherman dock his small boat with a few prize fish.\n*\"Why don't you stay out longer and catch more?\"* asked the banker.\nThe fisherman smiled: *\"I have enough. I sleep late, fish a little, play with my children, take a siesta with my wife, and stroll into the village to strum guitar with amigos.\"*\n\nThe banker scoffed: *\"I have an MBA! You should catch more, buy a bigger boat, open a factory, move to the capital, manage an IPO, and make millions!\"*\n*\"How long will that take?\"* asked the fisherman.\n*\"20 to 25 years!\"* replied the banker proudly.\n*\"And then what?\"*\n*\"Then you retire! You can move to a quiet village, sleep late, fish a little, play with grandchildren, take siestas, and play guitar with amigos!\"*\n\nThe fisherman chuckled softly and walked home to his family.",
    "description": "A profound 3-minute reminder about what true wealth and peace look like.",
    "searchUrl": "https://www.youtube.com/results?search_query=The%20Mexican%20Fisherman%20and%20the%20Wall%20Street%20Banker%20Classic%20Life%20Tale"
  },
  {
    "id": "reel-01",
    "category": "reel",
    "categoryLabel": "📱 Mindful Reel",
    "title": "Nature Relaxation Film 4K",
    "artist": "Relaxation Film",
    "duration": "2 mins",
    "youtubeId": "UV0mhY2Dxr0",
    "externalUrl": "https://www.youtube.com/watch?v=UV0mhY2Dxr0",
    "description": "A short, visual punch of motivation showing how morning clarity changes your whole reality.",
    "searchUrl": "https://www.youtube.com/results?search_query=Nature%20Relaxation%20Film%204K%20Relaxation%20Film"
  },
  {
    "id": "reel-02",
    "category": "reel",
    "categoryLabel": "📱 Mindful Reel",
    "title": "Amazing Nature Scenery",
    "artist": "Cat Trumpet",
    "duration": "3 mins",
    "youtubeId": "BHACKCNDMW8",
    "externalUrl": "https://www.youtube.com/watch?v=BHACKCNDMW8",
    "description": "Beautiful scenic imagery paired with a reminder that nothing written for you will miss you.",
    "searchUrl": "https://www.youtube.com/results?search_query=Amazing%20Nature%20Scenery%20Cat%20Trumpet"
  }
];

// In CommonJS or browser module
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_REWARDS };
}
