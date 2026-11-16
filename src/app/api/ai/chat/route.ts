import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1]?.content || '';
    const query = latestMessage.toLowerCase().trim();

    // Check if an OpenAI or Gemini API key is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are CampusFix AI, the intelligent facility maintenance assistant for CampusFix. You help university students, faculty, and administrators report campus maintenance issues, suggest accurate categories and urgency levels, draft clear descriptions, explain workflow stages (Open, Under Review, In Progress, Resolved), and guide users through campus facilities management. Be encouraging, concise, and helpful. Use clean markdown formatting with bullet points and bold text where appropriate.`,
              },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (err) {
        console.warn('External OpenAI API call failed, falling back to local facilities intelligence engine:', err);
      }
    }

    // Comprehensive Built-in CampusFix Facilities Intelligence Engine
    let reply = '';

    if (query.includes('how to report') || query.includes('report an issue') || query.includes('report maintenance') || query.includes('new issue')) {
      reply = `### 📋 How to Report a Campus Issue in 4 Simple Steps:

1. **Sign In**: Ensure you are logged into your Student or Faculty account.
2. **Navigate to Report**: Click the **"Report Issue"** button in the top navigation or dashboard.
3. **Fill in Details**:
   - **Title**: Clear and concise (e.g., *"Leaking sink in Engineering Hall 2nd floor restroom"*).
   - **Category**: Select the relevant department (e.g., *Plumbing, Electrical, IT, HVAC*).
   - **Location**: Specific building name, floor, and room number.
   - **Urgency**: Choose *Low*, *Medium*, *High*, or *Emergency*.
   - **Description**: Add details, symptoms, and safety concerns.
4. **Submit & Track**: Your report immediately enters the queue for triage. You'll receive real-time notifications as maintenance updates its status!`;
    } else if (query.includes('in progress') || query.includes('status mean') || query.includes('statuses') || query.includes('under review')) {
      reply = `### 🔄 Understanding CampusFix Issue Statuses:

- 🟡 **Open**: Report submitted and waiting in the triage queue for administrative review.
- 🔵 **Under Review**: Facilities dispatchers have examined the issue, verified details, and are planning the repair schedule.
- 🟣 **In Progress**: A maintenance technician or specialized team has been officially assigned and is actively working on the fix on-site.
- 🟢 **Resolved**: The physical repair has been completed, tested, and marked resolved with official notes from the technician.
- ⚪ **Closed**: The reporter has verified the fix or the ticket has completed its post-resolution verification period.
- 🔴 **Rejected / Duplicate**: The issue was identified as a duplicate of an existing ticket or outside facilities scope.`;
    } else if (query.includes('suggest category') || query.includes('category') || query.includes('categories') || query.includes('which category')) {
      reply = `### 🏷️ Recommended Campus Categories:

- 🚰 **Plumbing & Water**: Leaking faucets, clogged drains, toilet malfunctions, water fountain issues, ceiling drips.
- ⚡ **Electrical & Lighting**: Blown bulbs, power outages, flickering hallway lights, broken wall outlets.
- ❄️ **HVAC & Temperature**: Classroom too cold/hot, AC unit noise, broken thermostats, ventilation issues.
- 💻 **IT & Wi-Fi**: Weak campus Wi-Fi signals in lecture halls, broken projectors, podium audio issues.
- 🚪 **Carpentry & Furniture**: Broken chair desks, stuck doors, window latch failures, chalkboard/whiteboard damage.
- 🧹 **Custodial & Cleaning**: Spills, restroom supplies replenishment, recycling bin overflow.
- 🚨 **Safety & Accessibility**: Broken elevator, cracked stairs, unlit walkways, damaged handrails.

*Tip: Tell me what's broken and I will instantly tell you the exact category and urgency to select!*`;
    } else if (query.includes('draft') || query.includes('describe') || query.includes('description') || query.includes('help me write')) {
      reply = `### ✍️ Tips for Writing a High-Impact Issue Description:

A good maintenance report answers **Three Crucial Questions**:
1. **What is happening?** (e.g., *"The ceiling AC unit is violently vibrating and leaking water onto desk #14."*)
2. **Where exactly?** (e.g., *"Science & Tech Building, 3rd Floor, Lecture Hall 302, south wall near the projector."*)
3. **What is the impact / hazard?** (e.g., *"Students cannot sit in that row and the wet floor poses a slip hazard."*)

**Template to Copy & Paste:**
> **Location:** [Building Name, Floor, Room #]
> **Observation:** [What is broken / malfunctioning]
> **Safety/Impact:** [Is it causing disruption, leak, or safety hazard?]
> **When observed:** [First noticed this morning at 9:00 AM]`;
    } else if (query.includes('upvote') || query.includes('upvoting') || query.includes('feed') || query.includes('community')) {
      reply = `### 🗳️ Community Upvoting & Priority:

- **Campus Feed Visibility**: Every registered student and faculty member can view active issues across campus on the Campus Feed.
- **Boost Visibility**: If an issue affects you (e.g., Wi-Fi down in the library or broken AC in a shared hall), click the **Upvote (▲)** button.
- **Prioritization Algorithm**: Issues with higher community upvotes are flagged automatically in the Admin Command Center, signaling widespread campus impact so dispatchers can allocate technicians faster!`;
    } else if (query.includes('water') || query.includes('leak') || query.includes('leakage') || query.includes('pipe')) {
      reply = `### 🚰 Water / Leakage Advice:
- **Category**: **Plumbing & Water**
- **Recommended Urgency**: 
  - If a small drip: **Medium**
  - If flooding or leaking into electrical fixtures: **Emergency / High**
- **Action**: Please alert nearby students to avoid the wet floor. If water is near electrical outlets or equipment, notify building safety staff immediately!`;
    } else if (query.includes('wi-fi') || query.includes('wifi') || query.includes('internet') || query.includes('projector')) {
      reply = `### 💻 Classroom / IT Technology Advice:
- **Category**: **IT & Wi-Fi**
- **Recommended Urgency**: **High** if it is disrupting an active class or examination; **Medium** for general campus areas.
- **Detail to include**: Include the room number, Wi-Fi SSID (e.g., "Campus-Secure"), and whether you're experiencing complete disconnection or slow speeds.`;
    } else if (query.includes('admin') || query.includes('who fixes') || query.includes('technician') || query.includes('maintenance')) {
      reply = `### 🛠️ Campus Maintenance & Administration:
- Reports are processed through the **CampusFix Admin Command Center**.
- Dedicated university facilities staff review incoming tickets, assign them to trade crews (Plumbing, Electrical, HVAC, Custodial), and schedule technicians.
- You can follow updates in real-time on your **Dashboard** or issue detail page!`;
    } else {
      reply = `Hello! I'm **CampusFix AI**, your intelligent campus maintenance assistant. 🤖

I can assist you with:
- 📝 **Reporting an Issue**: Guidance on title, accurate description, and location details.
- 🏷️ **Category & Urgency Selection**: Choosing the right department (Plumbing, Electrical, HVAC, IT, Custodial).
- 🔄 **Tracking Status**: Explaining what *Open*, *Under Review*, *In Progress*, and *Resolved* mean.
- 🗳️ **Campus Upvotes**: How community upvotes help escalate widespread campus problems.

How can I help you keep our campus running smoothly today?`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('API /api/ai/chat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
