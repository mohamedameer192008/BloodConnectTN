import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GoogleGenAI client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY env variable is not set. AI features will run on simulation fallback.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. AI Chatbot endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message parameter is required." });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Offline fallback simulator
      return res.json({
        reply: `[Simulation Mode] Thank you for asking: "${message}". In whole blood donation, you can donate every 90 days if you are between 18 and 65, weigh at least 45 kg, and feel healthy. O- is the universal donor, and AB+ is the universal recipient. To activate full AI, please set your GEMINI_API_KEY in Secrets.`
      });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are "Arogya", a helpful and knowledgeable AI health assistant for BloodConnect TN, a voluntary blood donor finder platform in Tamil Nadu, India.
    Your job is to answer frequently asked questions about blood donation with scientific accuracy, empathy, and clarity.
    
    Guidelines:
    - Keep responses professional, encouraging, concise, and easy to read.
    - Reference safety guidelines: 90 days interval between whole blood donations, weight >= 45kg, age 18-65.
    - Explain blood compatibility accurately (O- is universal donor, AB+ is universal recipient).
    - Remind seekers that this platform is voluntary, and in extreme emergencies they should always coordinate with hospital blood banks directly or call 104 (TN medical helpline).
    - If appropriate, use subtle lists and spacing to make text readable. No Markdown formatting errors.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Reconstruct history if provided
    if (history && Array.isArray(history)) {
      // In @google/genai, we can send messages sequentially or pass simple history context in prompt.
      // Since chat instance is fresh, we will prepend the conversation history to the prompt for context.
    }

    let prompt = message;
    if (history && history.length > 0) {
      const context = history.slice(-6).map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
      prompt = `${context}\nUser: ${message}\nAssistant:`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Gemini Chatbot Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI chatbot response." });
  }
});

// 3. AI Eligibility Checker endpoint
app.post('/api/gemini/eligibility', async (req, res) => {
  try {
    const { age, weight, lastDonationDate, medicalConditions, travelHistory, lifestyleFactors } = req.body;
    
    // Quick clinical validations
    const ageNum = Number(age);
    const weightNum = Number(weight);
    
    let baseEligible = true;
    const reasons: string[] = [];

    if (ageNum < 18 || ageNum > 65) {
      baseEligible = false;
      reasons.push("Age must be between 18 and 65 years old.");
    }
    if (weightNum < 45) {
      baseEligible = false;
      reasons.push("Weight must be at least 45 kg.");
    }

    if (lastDonationDate) {
      const lastDate = new Date(lastDonationDate);
      const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        baseEligible = false;
        reasons.push(`Minimum interval between whole blood donations is 90 days. It has only been ${diffDays} days since your last donation.`);
      }
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Simulation response
      const finalEligibility = baseEligible && !medicalConditions;
      return res.json({
        eligible: finalEligibility,
        score: finalEligibility ? 95 : 30,
        analysis: `[Simulation Analysis] Based on your inputs (Age: ${age}, Weight: ${weight}kg, Last Donation: ${lastDonationDate || 'None'}), you are ${finalEligibility ? 'Eligible' : 'Not Eligible'} to donate blood. ${reasons.join(' ')} ${medicalConditions ? 'Medical conditions listed need review by a physician.' : 'Ensure you drink 500ml water and have a meal before donating.'}`,
        recommendations: [
          "Drink plenty of fluids (water/juice) the day before and day of donation.",
          "Have a healthy, low-fat meal 3 hours prior to donation.",
          "Avoid smoking or drinking alcohol for 24 hours preceding the drive.",
          "Ensure you get 7-8 hours of restful sleep."
        ]
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a blood donation eligibility check and health risk analysis.
      User Details:
      - Age: ${age} years old
      - Weight: ${weight} kg
      - Last Donation Date: ${lastDonationDate || 'Never / Not registered'}
      - Declared Medical Conditions (diabetes, hypertension, cardiac issues, active infections, medications, etc.): ${medicalConditions || 'None'}
      - Recent Travel History (e.g. malaria endemic areas): ${travelHistory || 'None'}
      - Lifestyle Factors (e.g. recent tattoos, piercings, high-risk exposure): ${lifestyleFactors || 'None'}
      
      Your analysis must calculate a safety eligibility score (0-100) and decide if they are eligible.
      Return the output as a JSON object matching this schema:
      {
        "eligible": boolean,
        "score": number,
        "analysis": "A brief medical assessment paragraph detailing why they are eligible or why they should rest or wait.",
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligible: { type: Type.BOOLEAN },
            score: { type: Type.INTEGER },
            analysis: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["eligible", "score", "analysis", "recommendations"]
        }
      }
    });

    let result = JSON.parse(response.text || '{}');
    // If hard validation failed, force eligible=false
    if (!baseEligible) {
      result.eligible = false;
      result.score = Math.min(result.score, 40);
      result.analysis = `${reasons.join(' ')} ${result.analysis}`;
    }

    res.json(result);
  } catch (err: any) {
    console.error("Gemini Eligibility Error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze eligibility." });
  }
});

// 4. Smart AI Recommendation / Matcher endpoint
app.post('/api/gemini/recommendations', async (req, res) => {
  try {
    const { requestDetails, availableDonors } = req.body;
    if (!requestDetails || !availableDonors || !Array.isArray(availableDonors)) {
      return res.status(400).json({ error: "Required parameters requestDetails and availableDonors are missing." });
    }

    // Blood compatibility helper function
    const getCompatibleGroups = (group: string): string[] => {
      switch (group) {
        case 'A+': return ['A+', 'A-', 'O+', 'O-'];
        case 'A-': return ['A-', 'O-'];
        case 'B+': return ['B+', 'B-', 'O+', 'O-'];
        case 'B-': return ['B-', 'O-'];
        case 'AB+': return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        case 'AB-': return ['A-', 'B-', 'AB-', 'O-'];
        case 'O+': return ['O+', 'O-'];
        case 'O-': return ['O-'];
        default: return [];
      }
    };

    const targetBloodGroup = requestDetails.bloodGroup;
    const compatibleGroups = getCompatibleGroups(targetBloodGroup);

    // Initial filter: must be blood compatible and not blocked
    let matching = availableDonors.filter(donor => {
      if (donor.blocked) return false;
      return compatibleGroups.includes(donor.bloodGroup);
    });

    // Distance sorting if location coordinate exists
    if (requestDetails.latitude && requestDetails.longitude) {
      const lat1 = requestDetails.latitude;
      const lon1 = requestDetails.longitude;
      
      matching = matching.map(donor => {
        let distance: number | null = null;
        if (donor.latitude && donor.longitude) {
          const R = 6371; // km
          const dLat = (donor.latitude - lat1) * Math.PI / 180;
          const dLon = (donor.longitude - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(donor.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }
        return { ...donor, distance };
      });
      
      // Sort by availability first, then distance
      matching.sort((a: any, b: any) => {
        const aAvail = a.availabilityStatus === 'Available' ? 1 : 0;
        const bAvail = b.availabilityStatus === 'Available' ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Sort by availability first, then verification status
      matching.sort((a, b) => {
        const aAvail = a.availabilityStatus === 'Available' ? 1 : 0;
        const bAvail = b.availabilityStatus === 'Available' ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        
        const aVer = a.verified ? 1 : 0;
        const bVer = b.verified ? 1 : 0;
        return bVer - aVer;
      });
    }

    // Pick top 3 recommendations
    const topMatches = matching.slice(0, 3);

    const key = process.env.GEMINI_API_KEY;
    if (!key || topMatches.length === 0) {
      // Simulation mode
      const resultMatches = topMatches.map((m, index) => ({
        donorId: m.id,
        rank: index + 1,
        matchScore: m.availabilityStatus === 'Available' ? 98 - (index * 4) : 75 - (index * 5),
        rationale: `Recommended because donor blood group is compatible (${m.bloodGroup} for patient's ${targetBloodGroup}), donor is active and currently located in ${m.city}, ${m.district}.`
      }));

      return res.json({
        matches: resultMatches,
        globalMatchingScore: topMatches.length > 0 ? 92 : 0,
        summary: `Found ${topMatches.length} excellent potential volunteer matches in the database. O- and O+ groups are prioritized according to compatibility and proximity rules.`
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Recommend the best blood donor matches for an urgent medical request.
      
      Patient request details:
      - Blood Group Required: ${targetBloodGroup}
      - Units Required: ${requestDetails.unitsRequired} bags
      - Hospital: ${requestDetails.hospitalName} in ${requestDetails.district}, Tamil Nadu
      - Emergency Level: ${requestDetails.emergencyLevel}
      
      Top Candidate Donors Available:
      ${JSON.stringify(topMatches.map(m => ({
        id: m.id,
        fullName: m.fullName,
        bloodGroup: m.bloodGroup,
        city: m.city,
        district: m.district,
        availabilityStatus: m.availabilityStatus,
        lastDonationDate: m.lastDonationDate,
        verified: m.verified,
        distance: (m as any).distance ? `${(m as any).distance.toFixed(1)} km` : 'unknown'
      })))}
      
      Formulate matching rationales, priority ranks, and individual match safety scores (0-100) based on:
      1. Ideal blood type compatibility.
      2. Geographic closeness (distance).
      3. Live availability.
      4. Verification status.
      
      Return a JSON object exactly matching this schema:
      {
        "matches": [
          {
            "donorId": "string - matching candidate donor ID",
            "rank": number,
            "matchScore": number,
            "rationale": "A brief sentence explaining why this donor is a great fit (e.g. 'Highly compatible O- donor located just 4km away at Mylapore')."
          }
        ],
        "globalMatchingScore": number,
        "summary": "A friendly summary paragraph outlining the overall availability of support for this patient."
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  donorId: { type: Type.STRING },
                  rank: { type: Type.INTEGER },
                  matchScore: { type: Type.INTEGER },
                  rationale: { type: Type.STRING }
                },
                required: ["donorId", "rank", "matchScore", "rationale"]
              }
            },
            globalMatchingScore: { type: Type.INTEGER },
            summary: { type: Type.STRING }
          },
          required: ["matches", "globalMatchingScore", "summary"]
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error("Gemini Recommendations Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate intelligent recommendations." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BloodConnect Server] Full-stack backend running at http://localhost:${PORT}`);
  });
}

startServer();
