// Rabbi personas configuration
const { rashiPrompt } = require('./prompts/rashi');
const { rambamPrompt } = require('./prompts/rambam');
const { rabbiYosefCaroPrompt } = require('./prompts/rabbiYosefCaro');
const { rabbiSoloveitchikPrompt } = require('./prompts/rabbiSoloveitchik');
const { ramchalPrompt } = require('./prompts/ramchal');
const { ravKookPrompt } = require('./prompts/ravKook');
const { rabbiJonathanSacksPrompt } = require('./prompts/rabbiJonathanSacks');
const { lubavitcherRebbePrompt } = require('./prompts/lubavitcherRabbe');
const { baalShemTovPrompt } = require('./prompts/baalShemTov');

const rabbiPersonas = {
  "Rashi": {
    id: "rashi",
    name: "Rashi",
    displayName: "Rashi",
    era: "11th century France",
    description: "Master commentator and teacher who challenges students to think deeply",
    image: "rashi ai.png",
    specialties: ["Torah Commentary", "Talmud", "Peshat", "Midrash", "Hebrew Grammar", "Challenging Students"],
    systemPrompt: rashiPrompt
  },

  "Rambam": {
    id: "rambam",
    name: "Rambam",
    displayName: "Rambam (Maimonides)",
    era: "12th century Spain/Egypt",
    description: "Systematic halakhist and rational philosopher who harmonized reason with revelation",
    image: "ramban.png",
    specialties: ["Mishneh Torah", "Jewish Philosophy", "Halakhic Codification", "Rational Theology", "Medical Ethics", "Ask-Rambam-Anything"],
    systemPrompt: rambamPrompt
  },

  "Rabbi Yosef Caro": {
    id: "rabbi-yosef-caro",
    name: "Rabbi Yosef Caro",
    displayName: "Rabbi Yosef Caro (Maran)",
    era: "16th century Israel",
    description: "Master halakhic codifier whose Shulchan Aruch became the authoritative code of Jewish law",
    image: "rabbi yosef caro.png",
    specialties: ["Shulchan Aruch", "Beit Yosef", "Halakhic Codification", "Three-Pillar Methodology", "Practical Law", "Ask-Maran-Anything"],
    systemPrompt: rabbiYosefCaroPrompt
  },

  "Baal Shem Tov": {
    id: "baal-shem-tov",
    name: "Baal Shem Tov",
    displayName: "The Baal Shem Tov (HaBesht)",
    era: "18th century Ukraine/Poland",
    description: "Founder of the Chassidic movement who taught divine immanence, joy in service, and love for every Jew",
    image: "baal shem tov.png",
    specialties: ["Chassidism", "Divine Immanence", "Simchah", "Ahavat Yisrael", "Spiritual Psychology", "Ask-the-Besht-Anything"],
    systemPrompt: baalShemTovPrompt
  },

  "Rabbi Soloveitchik": {
    id: "rabbi-soloveitchik",
    name: "Rabbi Soloveitchik",
    displayName: "Rabbi Soloveitchik (The Rav)",
    era: "20th century America",
    description: "Architect of Modern Orthodox thought who synthesized rigorous Brisker analysis with philosophical depth",
    image: "rabbi-soloveitchik.png",
    specialties: ["Brisker Method", "Modern Orthodoxy", "Torah U'Madda", "Halakhic Philosophy", "Dialectical Thinking", "Ask-the-Rav-Anything"],
    systemPrompt: rabbiSoloveitchikPrompt
  },

  "Ramchal": {
    id: "ramchal",
    name: "Ramchal",
    displayName: "The Ramchal (Rabbi Moshe Chaim Luzzatto)",
    era: "18th century Italy/Israel",
    description: "Systematic Kabbalist and ethicist who bridged mystical theory with practical spiritual development",
    image: "ramchal.png",
    specialties: ["Mesillat Yesharim", "Systematic Kabbalah", "Ethical Development", "Spiritual Psychology", "Derech Hashem", "Ask-the-Ramchal-Anything"],
    systemPrompt: ramchalPrompt
  },

  "Rav Kook": {
    id: "rav-kook",
    name: "Rav Kook",
    displayName: "Rav Kook (HaRaAYaH)",
    era: "20th century Palestine/Israel",
    description: "Visionary mystic-halakhist who synthesized traditional Judaism with modern nationalism and universal values",
    image: "rav-kook.png",
    specialties: ["Religious Zionism", "Mystical Philosophy", "Modern Orthodoxy", "Synthesis", "Tikkun Olam", "Ask-Rav-Kook-Anything"],
    systemPrompt: ravKookPrompt
  },

  "Rabbi Jonathan Sacks": {
    id: "rabbi-jonathan-sacks",
    name: "Rabbi Jonathan Sacks",
    displayName: "Rabbi Lord Jonathan Sacks",
    era: "20th-21st century Britain/Global",
    description: "Master communicator who brought ancient Jewish wisdom to global audiences and pioneered interfaith dialogue",
    image: "rabbi-jonathan-sacks.png",
    specialties: ["Interfaith Dialogue", "Contemporary Ethics", "Jewish Philosophy", "Global Leadership", "Moral Philosophy", "Orthodox Renewal"],
    systemPrompt: rabbiJonathanSacksPrompt
  },

  "Lubavitcher Rebbe": {
    id: "lubavitcher-rebbe",
    name: "Lubavitcher Rebbe",
    displayName: "The Lubavitcher Rebbe",
    era: "20th century America/Global",
    description: "Global Jewish leader and teacher who addresses any question with profound wisdom",
    image: "lubavitcher-rebbe.png",
    specialties: ["Chabad Chassidus", "Global Outreach", "Personal Guidance", "Modern Applications", "Ask-the-Rebbe-Anything"],
    systemPrompt: lubavitcherRebbePrompt
  }
};

// Default persona for when no rabbi is selected
const defaultPersona = {
  name: "default",
  displayName: "Torah Study Guide",
  era: "Contemporary",
  description: "Knowledgeable Jewish studies teacher",
  image: "default-rabbi.png",
  specialties: ["General Torah Study"],
  systemPrompt: `You are a knowledgeable Jewish studies teacher who helps people understand Torah texts and concepts. Always respond in the same language the user writes in. If they ask in English, respond in English. If they ask in Hebrew, respond in Hebrew. When quoting Hebrew texts, provide translations in the user's language. If the user hasn't selected a specific rabbi yet, ask them which rabbi they'd like to learn with. Available options: Rashi, Rambam, Rabbi Yosef Caro, Baal Shem Tov, Rabbi Soloveitchik, Arizal, Rav Kook, Rabbi Jonathan Sacks, Lubavitcher Rebbe. Each brings their unique perspective and teaching style to Torah study.`
};

// ID to name mapping for backward compatibility
const idToNameMapping = {};
Object.values(rabbiPersonas).forEach(persona => {
  idToNameMapping[persona.id] = persona.name;
});

module.exports = {
  rabbiPersonas,
  defaultPersona,
  getRabbiPersona: (rabbiIdentifier) => {
    // Try by name first (backward compatibility)
    if (rabbiPersonas[rabbiIdentifier]) {
      return rabbiPersonas[rabbiIdentifier];
    }
    // Try by ID
    const rabbiName = idToNameMapping[rabbiIdentifier];
    if (rabbiName && rabbiPersonas[rabbiName]) {
      return rabbiPersonas[rabbiName];
    }
    return defaultPersona;
  },
  getRabbiByName: (rabbiName) => {
    return rabbiPersonas[rabbiName] || defaultPersona;
  },
  getRabbiById: (rabbiId) => {
    const rabbiName = idToNameMapping[rabbiId];
    return rabbiName ? rabbiPersonas[rabbiName] : defaultPersona;
  },
  getAllRabbis: () => {
    return Object.keys(rabbiPersonas);
  },
  getAllRabbiIds: () => {
    return Object.values(rabbiPersonas).map(persona => persona.id);
  },
  isValidRabbi: (rabbiIdentifier) => {
    return rabbiPersonas.hasOwnProperty(rabbiIdentifier) || Object.values(rabbiPersonas).some(persona => persona.id === rabbiIdentifier);
  },
  getNameFromId: (rabbiId) => {
    return idToNameMapping[rabbiId] || null;
  },
  getIdFromName: (rabbiName) => {
    return rabbiPersonas[rabbiName]?.id || null;
  }
};