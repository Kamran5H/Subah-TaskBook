// Curated Reward Library for Subah Task Book
// Categories: Naat, Qawwali, Soulful Melody, Daily Mashwara (Wisdom), Inspiring Reading,
//             Mindful Reel, Dua & Zikr, Breathe & Move.
// Dua, Breathe & Move, and the extra Mashwara/Reading entries are content-only (no video):
// they render from local markdown, so they work fully offline and can never link-rot.
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
  },

  // ── Extra Mashwara (Wisdom) ────────────────────────────────────────────────
  {
    "id": "mashwara-04",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Eat the Frog: Do the Hardest Task First",
    "author": "Productivity Wisdom",
    "duration": "3 mins",
    "content": "### 🐸 Swallow the Frog\nMark Twain is said to have quipped: if the first thing you do each morning is eat a live frog, you can go through the day knowing the worst is already behind you.\n\n**The Mashwara:**\n1. Look at today's list and find the ONE task you are quietly dreading.\n2. Do it first, before email, before tea, before the easy wins.\n3. Notice how the whole day tilts downhill after that single act of courage.\n\n> *\"If it's your job to eat a frog, do it first thing in the morning.\"*",
    "description": "The single most reliable trick for beating procrastination on hard days.",
    "searchUrl": "https://www.youtube.com/results?search_query=eat%20the%20frog%20productivity%20do%20hardest%20task%20first"
  },
  {
    "id": "mashwara-05",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "The Two-Minute Rule for Starting",
    "author": "Atomic Habits Principle",
    "duration": "3 mins",
    "content": "### ⏱️ Shrink It Until You Start\nMotivation is overrated; starting is everything. When a task feels heavy, you are usually imagining the whole mountain instead of the first step.\n\n**The Mashwara:**\n- Redefine the task as a two-minute version. \"Write the report\" becomes \"open the doc and title it.\"\n- Promise yourself you may stop after two minutes.\n- You almost never will — motion creates momentum, and momentum finishes the job.",
    "description": "How to trick a reluctant mind into beginning heavy work.",
    "searchUrl": "https://www.youtube.com/results?search_query=two%20minute%20rule%20atomic%20habits"
  },
  {
    "id": "mashwara-06",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Gratitude Turns Enough Into Plenty",
    "author": "Timeless Wisdom",
    "duration": "3 mins",
    "content": "### 🙏 Count Three Blessings\nThe restless heart always chases the next thing and never arrives. A grateful heart is already home.\n\n**The Mashwara:**\nBefore your next task, name three specific blessings from the last hour — the warmth of your drink, a working body, a roof, a message from someone who cares.\n\n> *\"Gratitude turns what we have into enough.\"*\n\nAbundance is not a bigger pile; it is a clearer pair of eyes.",
    "description": "A 60-second reset that shifts you from lack to sufficiency.",
    "searchUrl": "https://www.youtube.com/results?search_query=gratitude%20practice%20three%20blessings"
  },
  {
    "id": "mashwara-07",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Progress, Not Perfection",
    "author": "Craftsman's Creed",
    "duration": "3 mins",
    "content": "### 🎯 Done Beats Perfect\nPerfectionism is fear wearing a fine suit. It whispers that unfinished-but-flawless is safer than finished-and-real. It is not.\n\n**The Mashwara:**\n- Ship the B+ version today; you can polish tomorrow with real feedback.\n- Ask: *would a wise friend call this good enough?* If yes, move on.\n- The world rewards finished work, not private masterpieces no one ever sees.",
    "description": "For the days a task stalls because it isn't 'perfect' yet.",
    "searchUrl": "https://www.youtube.com/results?search_query=progress%20not%20perfection%20overcoming%20perfectionism"
  },
  {
    "id": "mashwara-08",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Single-Tasking Is a Superpower",
    "author": "Deep Work Notes",
    "duration": "4 mins",
    "content": "### 🧠 One Thing at a Time\nSwitching between tasks feels productive but leaves a cognitive residue — part of your mind stays stuck on the last thing. You pay a tax on every switch.\n\n**The Mashwara:**\n1. Close every tab that does not serve the current task.\n2. Put the phone in another room, face down, on silent.\n3. Give one task twenty-five unbroken minutes. Then rest.\n\nDepth, not speed, is where your best work lives.",
    "description": "Why focus on one task outperforms juggling five.",
    "searchUrl": "https://www.youtube.com/results?search_query=deep%20work%20single%20tasking%20focus"
  },

  // ── Extra Thoughts to Ponder (Reading) ─────────────────────────────────────
  {
    "id": "reading-03",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Woodcutter Who Forgot to Sharpen His Axe",
    "author": "Classic Parable",
    "duration": "3 mins",
    "content": "### 🪓 Sharpen the Axe\nA strong young woodcutter felled many trees his first day. Determined to do better, he worked longer and harder each day after — yet his count kept falling.\n\nThe foreman asked: *\"When did you last sharpen your axe?\"*\nThe woodcutter blinked. *\"Sharpen? I've had no time — I've been too busy cutting.\"*\n\n**Reflect:**\nRest, learning, and reflection are not time stolen from work — they are what keeps the blade sharp. This very break is you sharpening your axe.",
    "description": "A reminder that rest and renewal make you more effective, not less.",
    "searchUrl": "https://www.youtube.com/results?search_query=woodcutter%20sharpen%20the%20axe%20story"
  },
  {
    "id": "reading-04",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Two Wolves Within",
    "author": "Cherokee Legend",
    "duration": "3 mins",
    "content": "### 🐺 Which Wolf Wins?\nAn elder told his grandson: *\"A battle rages inside me between two wolves. One is anger, envy, resentment, and fear. The other is peace, hope, kindness, and truth. The same fight is inside you, and inside every person.\"*\n\nThe boy thought, then asked: *\"Which wolf wins?\"*\n\nThe elder smiled quietly: *\"The one you feed.\"*\n\n**Reflect:**\nEvery task you finish with patience, every kind word, every honest effort — that is you feeding the good wolf today.",
    "description": "On the daily choice of what we nurture within ourselves.",
    "searchUrl": "https://www.youtube.com/results?search_query=two%20wolves%20cherokee%20story%20which%20one%20you%20feed"
  },
  {
    "id": "reading-05",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Emptied Cup",
    "author": "Zen Tradition",
    "duration": "3 mins",
    "content": "### 🍵 Empty Your Cup\nA proud scholar visited a Zen master to learn. As the master poured tea, he kept pouring past the brim, tea spilling everywhere. The scholar cried out, *\"Stop! The cup is full!\"*\n\nThe master replied: *\"Like this cup, you are full of your own opinions. How can I show you wisdom unless you first empty your cup?\"*\n\n**Reflect:**\nApproach today's hard problem like an empty cup — curious, humble, willing to be wrong. That is where new answers pour in.",
    "description": "On humility and staying open to learning.",
    "searchUrl": "https://www.youtube.com/results?search_query=zen%20empty%20your%20cup%20story"
  },
  {
    "id": "reading-06",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Elephant and the Rope",
    "author": "Eastern Fable",
    "duration": "3 mins",
    "content": "### 🐘 The Thin Rope\nA traveler saw great elephants held by nothing but a thin rope tied to a small stake. Any one of them could snap it in a second, yet none tried.\n\nThe keeper explained: *\"When they are young and small, that same rope truly holds them. They try, they fail, and in time they stop trying. They grow enormous still believing the rope can hold them.\"*\n\n**Reflect:**\nWhich old \"I can't\" is a rope you outgrew years ago? Test it today. You may be far stronger than the story you inherited.",
    "description": "On the invisible limits we carry long after they stop being true.",
    "searchUrl": "https://www.youtube.com/results?search_query=elephant%20and%20the%20rope%20motivational%20story"
  },
  {
    "id": "reading-07",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Farmer's 'Maybe'",
    "author": "Taoist Parable",
    "duration": "4 mins",
    "content": "### 🐎 We'll See\nA farmer's horse ran away. \"How unlucky!\" said the neighbors. *\"Maybe,\"* said the farmer.\n\nThe horse returned with three wild horses. \"How lucky!\" *\"Maybe,\"* he said.\n\nHis son broke his leg taming one. \"How terrible!\" *\"Maybe.\"*\n\nThe army came conscripting young men for war but passed over the son with the broken leg. \"How fortunate!\" *\"Maybe,\"* said the farmer.\n\n**Reflect:**\nToday's setback and today's win are both just chapters. Hold both loosely, keep working, and let the story unfold.",
    "description": "On equanimity — not judging each event as it lands.",
    "searchUrl": "https://www.youtube.com/results?search_query=chinese%20farmer%20maybe%20story%20alan%20watts"
  },

  // ── Dua & Remembrance (offline, always available) ──────────────────────────
  {
    "id": "dua-01",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Dua for Ease in a Difficult Task",
    "author": "Prophetic Supplication",
    "duration": "2 mins",
    "content": "### 🤲 A Dua for Ease\n*Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla.*\n\n**Meaning:**\n\"O Allah, there is no ease except in what You have made easy, and You make the difficult easy if You will.\"\n\n**Practice:**\nBreathe slowly, say it once with full presence, and return to your task trusting that effort is yours and outcome is His.",
    "description": "A short, calming supplication to recite before hard work.",
    "searchUrl": "https://www.youtube.com/results?search_query=dua%20for%20ease%20allahumma%20la%20sahla%20illa"
  },
  {
    "id": "dua-02",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Seeking Beneficial Knowledge & Focus",
    "author": "Prophetic Supplication",
    "duration": "2 mins",
    "content": "### 🤲 For a Clear Mind\n*Rabbi zidni 'ilma.* — \"My Lord, increase me in knowledge.\" (Qur'an 20:114)\n\nAnd: *Allahumma infa'ni bima 'allamtani wa 'allimni ma yanfa'uni.* — \"O Allah, benefit me by what You taught me, teach me what benefits me.\"\n\n**Practice:**\nSay these before study or focused work. Ask for clarity, then give the task your sincere attention.",
    "description": "Supplications for clarity and beneficial focus before study.",
    "searchUrl": "https://www.youtube.com/results?search_query=rabbi%20zidni%20ilma%20dua%20for%20knowledge"
  },
  {
    "id": "dua-03",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "The Weightless Words of Zikr",
    "author": "Hadith",
    "duration": "2 mins",
    "content": "### 🌿 Light on the Tongue, Heavy on the Scale\n*SubhanAllahi wa bihamdihi, SubhanAllahil-'Azeem.*\n\n\"Two words light upon the tongue, heavy on the Scale, beloved to the Most Merciful.\"\n\n**Practice:**\nRepeat gently ten times, matching each phrase to a slow breath. Feel the mind quiet as the words settle the heart.",
    "description": "A brief, soothing remembrance to reset between tasks.",
    "searchUrl": "https://www.youtube.com/results?search_query=subhanallahi%20wa%20bihamdihi%20zikr"
  },
  {
    "id": "dua-04",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Dua Against Worry & Anxiety",
    "author": "Prophetic Supplication",
    "duration": "3 mins",
    "content": "### 🕊️ When the Chest Feels Tight\n*Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal.*\n\n**Meaning:**\n\"O Allah, I seek refuge in You from worry and grief, from helplessness and laziness.\"\n\n**Practice:**\nName what is weighing on you, say the dua, and then take one small concrete action. Trust plus action dissolves anxiety far better than either alone.",
    "description": "A supplication to lift worry and restlessness mid-day.",
    "searchUrl": "https://www.youtube.com/results?search_query=dua%20for%20anxiety%20worry%20allahumma%20inni%20audhu%20bika%20minal%20hammi"
  },
  {
    "id": "dua-05",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Gratitude After Completion",
    "author": "Prophetic Practice",
    "duration": "2 mins",
    "content": "### 🌟 Close the Loop With Thanks\nWhen a task is done, pause and say: *Alhamdulillah* — all praise belongs to God.\n\n**Practice:**\nDon't rush from one finish line straight into the next race. Give the completed work three breaths of quiet gratitude. This is how effort becomes blessing rather than mere busyness.",
    "description": "A tiny gratitude ritual to seal each accomplishment.",
    "searchUrl": "https://www.youtube.com/results?search_query=alhamdulillah%20gratitude%20reflection"
  },
  {
    "id": "dua-06",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Istighfar — The Opener of Doors",
    "author": "Hadith",
    "duration": "3 mins",
    "content": "### 🚪 Astaghfirullah\nIt is related that whoever keeps to seeking forgiveness, God grants him relief from every worry, a way out of every hardship, and provision from where he did not expect.\n\n**Practice:**\nGently repeat *Astaghfirullah* while walking to refill your water or stretch. Let each repetition loosen a knot of tension you didn't know you were holding.",
    "description": "A gentle, repetitive remembrance for a restless break.",
    "searchUrl": "https://www.youtube.com/results?search_query=astaghfirullah%20istighfar%20benefits"
  },

  // ── Breathe & Move (guided micro-practices, fully offline) ──────────────────
  {
    "id": "breathe-01",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "Box Breathing — Calm in 4 Rounds",
    "author": "Guided Practice",
    "duration": "3 mins",
    "content": "### 🌬️ Box Breathing (4-4-4-4)\nUsed by athletes and calm professionals to steady the nervous system in minutes.\n\n**Do this four times:**\n1. Breathe **in** through the nose — 4 counts.\n2. **Hold** — 4 counts.\n3. Breathe **out** through the mouth — 4 counts.\n4. **Hold** empty — 4 counts.\n\nDrop the shoulders. Soften the jaw. Notice the mind grow quiet and wide. Return to work from stillness, not from rush.",
    "description": "A 3-minute breathing pattern that resets a racing mind.",
    "searchUrl": "https://www.youtube.com/results?search_query=box%20breathing%204%204%204%204%20guided"
  },
  {
    "id": "breathe-02",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "4-7-8 Breath — The Natural Tranquilizer",
    "author": "Guided Practice",
    "duration": "3 mins",
    "content": "### 😌 The 4-7-8 Breath\nA simple pattern that gently downshifts the body toward rest.\n\n**Repeat four cycles:**\n- Inhale quietly through the nose for **4**.\n- Hold the breath for **7**.\n- Exhale fully through the mouth, lips pursed, for **8** (a soft whoosh).\n\nThe long exhale is the secret — it tells your body it is safe. Perfect after a tense stretch of work.",
    "description": "A calming breath ratio to melt tension after focus.",
    "searchUrl": "https://www.youtube.com/results?search_query=4-7-8%20breathing%20technique%20guided"
  },
  {
    "id": "breathe-03",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "The 20-20-20 Eye Rest",
    "author": "Screen Wellness",
    "duration": "2 mins",
    "content": "### 👀 Rescue Your Eyes\nHours of screen work leave the eyes strained and the mind foggy. This rule from optometrists costs almost nothing.\n\n**The practice:**\nEvery 20 minutes, look at something **20 feet** away for **20 seconds**. Right now, glance out a window or across the room at the farthest point you can find. Blink slowly ten times.\n\nYour eyes are muscles too — let them stretch.",
    "description": "A tiny practice to relieve screen-tired eyes.",
    "searchUrl": "https://www.youtube.com/results?search_query=20-20-20%20rule%20eye%20strain"
  },
  {
    "id": "breathe-04",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "Desk Stretch — Unlock the Body",
    "author": "Movement Break",
    "duration": "4 mins",
    "content": "### 🧘 Stand and Unlock\nSitting stiffens the body and dulls the mind. Give yourself four minutes of gentle movement.\n\n**Flow slowly through each:**\n1. Stand, reach both arms overhead, lengthen the spine — 3 breaths.\n2. Roll the shoulders back five times, then forward five times.\n3. Gently tilt the head ear-to-shoulder, each side — 3 breaths.\n4. Clasp hands behind the back, open the chest — 3 breaths.\n5. Twist gently left, then right, from the waist.\n\nSit back down taller, lighter, and clearer.",
    "description": "A guided desk-side stretch to release built-up tension.",
    "searchUrl": "https://www.youtube.com/results?search_query=desk%20stretch%20routine%20for%20office%20workers"
  },
  {
    "id": "breathe-05",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "One-Minute Grounding (5-4-3-2-1)",
    "author": "Mindfulness Practice",
    "duration": "2 mins",
    "content": "### 🌍 Come Back to Now\nWhen the mind is scattered across a dozen worries, this sensory anchor pulls you gently back to the present.\n\n**Slowly notice:**\n- **5** things you can see.\n- **4** things you can feel (chair, floor, fabric, breath).\n- **3** things you can hear.\n- **2** things you can smell.\n- **1** thing you can taste, or one slow, grateful breath.\n\nThe present moment is the only place work actually gets done. Welcome back.",
    "description": "A grounding sequence to gather a scattered mind.",
    "searchUrl": "https://www.youtube.com/results?search_query=5-4-3-2-1%20grounding%20technique%20mindfulness"
  },

  // ── More Mashwara (Wisdom) ─────────────────────────────────────────────────
  {
    "id": "mashwara-09",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Protect Your First Hour",
    "author": "Morning Discipline",
    "duration": "3 mins",
    "content": "### 🌅 The Hour That Sets the Tone\nThe first hour after waking quietly programs the whole day. Reach for the phone and you hand your attention to a hundred strangers before you have even greeted yourself.\n\n**The Mashwara:**\n1. Keep the screen dark for the first hour — no feeds, no news, no inbox.\n2. Do one grounding thing first: prayer, water, a stretch, a page of writing.\n3. Only then open the day's work, arriving as the author of your morning, not its guest.",
    "description": "Why guarding the first hour reshapes the entire day.",
    "searchUrl": "https://www.youtube.com/results?search_query=protect%20your%20first%20hour%20morning%20routine"
  },
  {
    "id": "mashwara-10",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Done Is a Gift You Give Tomorrow",
    "author": "Momentum Notes",
    "duration": "3 mins",
    "content": "### 🎁 Finish One Thing Fully\nA pile of half-done tasks weighs more than a stack of finished ones, because each unfinished thing keeps a small tab open in the mind.\n\n**The Mashwara:**\n- Pick the task closest to the finish line and close it completely before starting anything new.\n- Notice the quiet relief of a truly finished thing.\n- Every completion today is a gift handed to the calmer, lighter version of you tomorrow.",
    "description": "On the compounding peace of fully finishing one task.",
    "searchUrl": "https://www.youtube.com/results?search_query=finish%20what%20you%20start%20momentum%20productivity"
  },
  {
    "id": "mashwara-11",
    "category": "mashwara",
    "categoryLabel": "💡 Daily Mashwara",
    "title": "Compare Only to Yesterday's You",
    "author": "Timeless Wisdom",
    "duration": "3 mins",
    "content": "### 🪞 The Only Fair Race\nComparing your chapter one to someone else's chapter twenty is a quiet thief of joy. The only honest measure of progress is the person you were yesterday.\n\n**The Mashwara:**\nAsk one gentle question: *am I one small step better than yesterday?* One task done, one habit kept, one kind word given. That step, repeated, is how ordinary days become an extraordinary life.",
    "description": "A kinder, truer yardstick for measuring your own progress.",
    "searchUrl": "https://www.youtube.com/results?search_query=compare%20yourself%20to%20who%20you%20were%20yesterday"
  },

  // ── More Thoughts to Ponder (Reading) ──────────────────────────────────────
  {
    "id": "reading-08",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Two Buckets at the Well",
    "author": "Sufi Parable",
    "duration": "3 mins",
    "content": "### 🪣 Full and Empty\nTwo buckets met at the well. One sighed: *\"No matter how full I come up, I always go down empty again — what is the use?\"*\n\nThe other smiled: *\"I see it the other way. No matter how empty I go down, I always come back up full.\"*\n\n**Reflect:**\nThe same day, the same work, two entirely different hearts. Today you will dip into effort and come up tired — but you will also come up fuller. Which bucket will you be?",
    "description": "On choosing the lens through which you meet effort.",
    "searchUrl": "https://www.youtube.com/results?search_query=two%20buckets%20at%20the%20well%20optimism%20story"
  },
  {
    "id": "reading-09",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Butterfly and the Struggle",
    "author": "Nature's Lesson",
    "duration": "3 mins",
    "content": "### 🦋 The Necessary Struggle\nA man found a cocoon and watched a butterfly labor for hours to squeeze through a tiny opening. Wanting to help, he snipped the cocoon wide. The butterfly emerged easily — but with a swollen body and shrivelled wings. It never flew.\n\nThe struggle through the narrow opening is precisely what forces fluid into the wings. Without it, there is no flight.\n\n**Reflect:**\nThe difficulty in today's hard task is not in your way — it is building the very strength you will need to carry what comes next.",
    "description": "On why the struggle itself is what makes us capable.",
    "searchUrl": "https://www.youtube.com/results?search_query=butterfly%20cocoon%20struggle%20story%20meaning"
  },
  {
    "id": "reading-10",
    "category": "reading",
    "categoryLabel": "📖 Thought to Ponder",
    "title": "The Coffee, the Cup, and the Life",
    "author": "Modern Parable",
    "duration": "4 mins",
    "content": "### ☕ It Was Never About the Cup\nAlumni visited an old professor, and soon their talk turned to complaints about stress and work. He served coffee in a jumble of cups — some crystal, some cracked, some plain.\n\n*\"Notice,\"* he said, *\"that you all reached for the finest cups and left the plain ones. The cup adds nothing to the coffee — sometimes it only hides what we drink. What you truly wanted was coffee, not the cup. Yet you consciously went for the best.\"*\n\n**Reflect:**\nMoney, status, and title are just cups. Life is the coffee. Don't let chasing finer cups make you forget to actually enjoy the coffee while it's warm.",
    "description": "A reminder not to mistake the container for the life inside it.",
    "searchUrl": "https://www.youtube.com/results?search_query=coffee%20and%20the%20cup%20professor%20story"
  },

  // ── More Dua & Remembrance (offline, always available) ─────────────────────
  {
    "id": "dua-07",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Reliance After Effort (Tawakkul)",
    "author": "Prophetic Practice",
    "duration": "2 mins",
    "content": "### 🌿 Tie Your Camel, Then Trust\nA man asked whether to tie his camel or simply trust in God. The answer: *\"Tie your camel, then trust in God.\"*\n\n**Practice:**\nDo your honest part on the task — the planning, the effort, the care. Then release the outcome with *Tawakkaltu 'ala Allah* — \"I place my trust in God.\" Effort is your duty; the result is not your burden to carry.",
    "description": "The balance of full effort and calm surrender of the result.",
    "searchUrl": "https://www.youtube.com/results?search_query=tie%20your%20camel%20then%20trust%20tawakkul"
  },
  {
    "id": "dua-08",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Hasbunallah — Sufficiency in the Storm",
    "author": "Qur'anic Remembrance",
    "duration": "2 mins",
    "content": "### 🛡️ God Is Enough\n*HasbunAllahu wa ni'mal-wakeel.* — \"God is sufficient for us, and He is the best disposer of affairs.\" (Qur'an 3:173)\n\n**Practice:**\nWhen a task or worry feels far larger than you, breathe slowly and repeat this phrase seven times. Feel the weight shift from your shoulders to the One who can actually carry it. Then take the next small step.",
    "description": "A powerful phrase of sufficiency for overwhelming moments.",
    "searchUrl": "https://www.youtube.com/results?search_query=hasbunallah%20wa%20nimal%20wakeel%20meaning"
  },
  {
    "id": "dua-09",
    "category": "dua",
    "categoryLabel": "🤲 Dua & Zikr",
    "title": "Salawat — A Rest for the Heart",
    "author": "Prophetic Practice",
    "duration": "2 mins",
    "content": "### 💚 Send Blessings, Receive Peace\n*Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad.*\n\nIt is taught that whoever sends blessings upon the Prophet ﷺ once, God sends mercy upon them tenfold.\n\n**Practice:**\nBetween two tasks, pause and send salawat ten slow times. Let the rhythm soften your breathing and settle your heart before you begin again.",
    "description": "A gentle, rhythmic remembrance that eases the heart between tasks.",
    "searchUrl": "https://www.youtube.com/results?search_query=salawat%20durood%20benefits%20peace"
  },

  // ── More Breathe & Move (guided micro-practices, fully offline) ─────────────
  {
    "id": "breathe-06",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "The Physiological Sigh — Reset in 3 Breaths",
    "author": "Guided Practice",
    "duration": "2 mins",
    "content": "### 😮‍💨 The Fastest Calm\nNeuroscience found the quickest way to lower stress in real time: the physiological sigh — a double inhale followed by a long exhale.\n\n**Repeat three times:**\n1. Inhale through the nose.\n2. On top of it, sip a second short inhale to fully inflate the lungs.\n3. Exhale slowly and completely through the mouth.\n\nThree rounds is often enough to feel the body downshift. Use it before anything that makes your pulse rise.",
    "description": "A science-backed breath that calms the body in under a minute.",
    "searchUrl": "https://www.youtube.com/results?search_query=physiological%20sigh%20breathing%20technique"
  },
  {
    "id": "breathe-07",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "Hand on Heart — A Kindness Pause",
    "author": "Self-Compassion Practice",
    "duration": "2 mins",
    "content": "### 🫶 Be Gentle With Yourself\nWhen a task goes badly or the inner critic gets loud, the body responds to warmth and touch even from your own hand.\n\n**The practice:**\n1. Place one hand gently over your heart, feel its warmth.\n2. Take three slow breaths and silently offer yourself one kind sentence: *\"This is hard, and I am doing my best.\"*\n3. Return to work as you would to a friend you respect — with patience, not punishment.",
    "description": "A 60-second self-compassion reset for a hard moment.",
    "searchUrl": "https://www.youtube.com/results?search_query=hand%20on%20heart%20self%20compassion%20exercise"
  },
  {
    "id": "breathe-08",
    "category": "breathing",
    "categoryLabel": "🌬️ Breathe & Move",
    "title": "Walk the Room — Reset the Legs",
    "author": "Movement Break",
    "duration": "3 mins",
    "content": "### 🚶 Motion Changes Emotion\nStuck thinking usually lives in a stuck body. A short walk floods the brain with fresh blood and often shakes an idea loose that sitting never could.\n\n**The practice:**\n1. Stand and walk slowly around the room or to a window and back, three times.\n2. Let the arms swing, roll the shoulders, unclench the jaw.\n3. Look far away as you move. Return to the desk and notice the problem has quietly rearranged itself.",
    "description": "A brief walking reset for when thinking gets stuck.",
    "searchUrl": "https://www.youtube.com/results?search_query=walking%20break%20movement%20focus%20reset"
  }
];

// In CommonJS or browser module
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_REWARDS };
}
