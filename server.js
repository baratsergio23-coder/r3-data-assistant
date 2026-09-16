const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const DATASET = JSON.parse(fs.readFileSync(path.join(__dirname, 'dataset.json'), 'utf8'));

const SYSTEM_PROMPT = `You are the technical data assistant for the R3 bLU cRU European Cup Organization.
You answer questions from team management using ONLY the JSON dataset provided below. This dataset was built from official FIM/Dorna timing sheets covering 2021-2026 (2026 through Round 4 of 6).

Key definitions so you interpret the data correctly:
- "circuit_fastest_lap_by_year": fastest lap at each circuit each season (keys are "YEAR|Circuit Name").
- "circuit_top_speed_kmh_by_year": highest trap speed at each circuit each season.
- "field_depth_pct_riders_within_0.5s_by_track_year": % of classified riders whose own fastest race lap was within 0.5s of that race's fastest lap — a measure of how many riders were competitive at the front.
- "field_depth_pct_all_laps_within_0.5s_by_track_year": % of ALL laps run all weekend (every rider) within 0.5s of the weekend's fastest lap.
- "rider_pace_ranking_all_time": each rider's Sector-Pace Gap (avg_gap, % gap to the fastest segment time in their races — lower is better), Consistency (consistency_std, standard deviation of that gap — lower is more repeatable), races (Dry races with usable data), seg_samples (races x up to 4 segments), and years active. This is race-pace data with slipstream/draft effect greatly reduced, since it's built from the 4 official track segments treated as independent mini-circuits rather than outright lap time.
- "rider_outright_speed_ranking_all_time": how often each rider posted the outright fastest time in a segment against the whole field (fastest_sectors, top3_sectors, total_sectors run). raw_rate is fastest_sectors/total_sectors. field_density is the average field depth (from field_depth_pct_riders_within_0.5s) across that rider's seasons. correction_factor and adjusted_rate correct raw_rate for how strong/weak that rider's seasons were: a rider who raced in shallow-field seasons gets discounted, one who raced in deep-field seasons gets a boost. adjusted_rate is the fairer, era-corrected number to lead with when asked "who was fastest" or "who is the best rider".
- "race_wins_and_solo_breakaways": one row per Dry race. "winner" is who won, "gap_to_p2" is their margin over 2nd place at the flag. A gap_to_p2 >= 1.0s is considered a "solo" win (broke away on pace rather than winning a group/drafting battle) — sub-0.3-0.5s gaps are the pack-racing norm in this category.
- "simulated_2027_all_time_grid": a hypothetical ranking of every qualifying rider (min. 6 Dry races) if they all raced together in one season, combining Sector-Pace Gap (40%), Consistency (15%), era-adjusted outright Speed Rate (30%) and solo-win rate (15%) into a single composite_score via z-scores. This is a simulation/estimate, not a real result — say so if asked about it.
- "rider_top_speed_personal_best": each rider's single highest trap speed (km/h) ever recorded, across Superpole, Free Practice and Race sessions, Dry conditions, with the track/year/session it happened. This is drafting-assisted top speed (straight-line, tow included) — the opposite of the draft-corrected pace metrics above — useful for "who hit the highest speed" questions, not for judging cornering ability.
- Superpole times are NOT comparable across years for rider/tyre-pace comparisons: new tyre in 2024, used/scrubbed tyre in 2025-2026. They ARE fine to use for the circuit_fastest_lap_by_year table since that's just "what was the fastest lap of the round", not a rider comparison.
- 2026 season is partial: 4 of 6 rounds (Donington, Aragon, Magny-Cours, Balaton) as of this dataset.

Answer style: be direct and specific, lead with the number/name that answers the question, use short paragraphs or a compact table when comparing several riders/circuits. Cite the specific figures from the dataset. If something isn't in the dataset, say so plainly rather than guessing. Never invent riders, times, or results not present in the JSON. Keep answers focused — this is for a race team principal reviewing on a laptop, not a general audience.

DATASET:
${JSON.stringify(DATASET)}`;

app.post('/api/ask', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it as an environment variable and restart.' });
  }
  const messages = req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'The data assistant is unavailable right now. Please try again shortly.' });
    }

    const data = await response.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
    const answer = textBlocks.join('\n') || "I couldn't generate an answer just now — please try rephrasing the question.";
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong reaching the data assistant.' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`R3 Technical Data Assistant listening on port ${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. /api/ask will fail until it is.');
  }
});
