
import React, { useEffect, useMemo, useState } from "react";
import "./Survey.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const PARTIES = [
  "BJP",
  "Indian National Congress",
  "Aam Aadmi Party (AAP)",
  "Shiromani Akali Dal (SAD)",
  "Waris Punjab De",
  "Other"
];

const PROFESSIONS = [
  "Business Owner / Entrepreneur",
  "Trader / Shopkeeper",
  "Farmer / Agricultural Worker",
  "Government Employee",
  "Private Sector Employee",
  "Self-Employed / Freelancer",
  "Professional (Doctor, Lawyer, Engineer, etc.)",
  "Daily Wage Worker / Labourer",
  "Student",
  "Homemaker",
  "Retired",
  "Unemployed / Job Seeker",
  "Other"
];

const ISSUES = [
  "Drugs",
  "Crime",
  "Corruption",
  "Unemployment",
  "Other"
];

const LEADERS = [
  "Bhagwant Mann",
  "Charanjit Singh Channi",
  "Amritpal Singh",
  "Sukhbir Badal",
  "Kewal Singh Dhillon",
  "Pargat Singh",
  "Rahul Gandhi",
  "Narendra Modi",
  "Amit Shah",
  "Arvind Kejriwal"
];

const OPINIONS = ["Very Positive", "Positive", "Negative", "Neutral"];
const CONGRESS_RATINGS = ["Very Good", "Good", "Average", "Poor", "Very Poor"];

const CAMPAIGN_EXPECTATIONS = [
  "Personal relationships with candidates",
  "Community or social commitments",
  "Short-term benefits or incentives",
  "Financial assistance",
  "Gifts or other offerings",
  "Party leadership and influence",
  "Other"
];

const QUESTIONS = [
  { id: "respondent_name", section: "Respondent Details", title: "Name (Person)", type: "text" },
  { id: "gender", section: "Respondent Details", title: "Gender", type: "radio", options: ["Male", "Female"] },
  { id: "age", section: "Respondent Details", title: "Age", type: "number" },
  { id: "occupation", section: "Respondent Details", title: "Profession", type: "radio", options: PROFESSIONS },
  
  {
    id: "education_qualification",
    section: "Respondent Details",
    title: "Education Qualification",
    type: "radio",
    options: [
      "No Formal Education",
      "Primary",
      "Middle",
      "Matriculation",
      "Senior Secondary",
      "Diploma",
      "Graduate",
      "Postgraduate",
      "Doctorate",
      "Other"
    ]
  },
  { id: "years_in_area", section: "Respondent Details", title: "How long have you lived in this area?", type: "text" },
  { id: "booth_number", section: "Respondent Details", title: "Booth Number", type: "text" },
  { id: "village_ward", section: "Respondent Details", title: "Village / Ward Number", type: "text" },
  { id: "booth_name", section: "Respondent Details", title: "Booth Name", type: "text" },
  { id: "house_address", section: "Respondent Details", title: "House Address", type: "text" },
  { id: "voter_id", section: "Respondent Details", title: "Voter ID", type: "text" },
  { id: "phone_number", section: "Respondent Details", title: "Phone Number", type: "text" },
  { id: "constituency", section: "Respondent Details", title: "Assembly Constituency", type: "text" },
  { id: "preferred_candidate", section: "Political Preferences", title: "Preferred Candidate Name", type: "text" },
  { id: "local_issues", section: "Local Issues", title: "What are the problems / issues in this area?", type: "multi", options: ISSUES },
  { id: "leader_opinion", section: "Leadership Opinion", title: "What is your opinion of these political leaders?", type: "matrix", rows: LEADERS, options: OPINIONS },
  { id: "electricity_finance_opinion", section: "Leadership Opinion", title: "What is your opinion on electricity benefits and financial assistance provided by the Bhagwant Mann government?", type: "radio", options: OPINIONS },
  { id: "preferred_party", section: "Political Preferences", title: "What is your preferred political party?", type: "radio", options: PARTIES },
  { id: "second_choice_party", section: "Political Preferences", title: "Apart from your first-choice political party, which other political party would you consider supporting?", type: "radio", options: PARTIES },
  { id: "campaign_expectations", section: "Campaign Expectations", title: "What do voters in your locality expect from political candidates during election campaigns?", type: "multi", options: CAMPAIGN_EXPECTATIONS },
  { id: "congress_team_assessment", section: "Political Preferences", title: "How would you assess the current leadership, internal coordination and overall functioning of the Punjab Congress team?", type: "radio", options: CONGRESS_RATINGS }
];

const LANG = {
  en: {
    heading: "AI-Powered Public Opinion Survey, Research, Intelligence & Analytics Report",
    subtitle: "LokPulseIQ AI",
    submit: "Submit Survey",
    submitting: "Submitting...",
    consent: "I voluntarily agree to participate in this public opinion survey.",
    success: "Survey submitted successfully!",
    track: "Your Track ID",
    required: "Please complete the required fields and provide consent.",
    other: "Please specify",
    words: "words",
    sections: {
      "Respondent Details": "Respondent Details",
      "Local Issues": "Local Issues",
      "Leadership Opinion": "Leadership Opinion",
      "Political Preferences": "Political Preferences",
      "Campaign Expectations": "Campaign Expectations"
    }
  },
  hi: {
    heading: "AI-संचालित जनमत सर्वेक्षण, अनुसंधान, इंटेलिजेंस एवं एनालिटिक्स रिपोर्ट",
    subtitle: "LokPulseIQ AI",
    submit: "सर्वेक्षण जमा करें",
    submitting: "जमा हो रहा है...",
    consent: "मैं स्वेच्छा से इस जनमत सर्वेक्षण में भाग लेने के लिए सहमत हूं।",
    success: "सर्वेक्षण सफलतापूर्वक जमा हो गया!",
    track: "आपकी ट्रैक आईडी",
    required: "कृपया आवश्यक जानकारी भरें और सहमति दें।",
    other: "कृपया बताएं",
    words: "शब्द",
    sections: {
      "Respondent Details": "उत्तरदाता का विवरण",
      "Local Issues": "स्थानीय मुद्दे",
      "Leadership Opinion": "नेतृत्व पर राय",
      "Political Preferences": "राजनीतिक पसंद",
      "Campaign Expectations": "चुनावी अपेक्षाएं"
    }
  },
  pa: {
    heading: "AI-ਸੰਚਾਲਿਤ ਲੋਕ ਰਾਏ ਸਰਵੇਖਣ, ਖੋਜ, ਇੰਟੈਲੀਜੈਂਸ ਅਤੇ ਐਨਾਲਿਟਿਕਸ ਰਿਪੋਰਟ",
    subtitle: "LokPulseIQ AI",
    submit: "ਸਰਵੇਖਣ ਜਮ੍ਹਾਂ ਕਰੋ",
    submitting: "ਜਮ੍ਹਾਂ ਹੋ ਰਿਹਾ ਹੈ...",
    consent: "ਮੈਂ ਆਪਣੀ ਮਰਜ਼ੀ ਨਾਲ ਇਸ ਸਰਵੇਖਣ ਵਿੱਚ ਹਿੱਸਾ ਲੈਣ ਲਈ ਸਹਿਮਤ ਹਾਂ।",
    success: "ਸਰਵੇਖਣ ਸਫਲਤਾਪੂਰਵਕ ਜਮ੍ਹਾਂ ਹੋ ਗਿਆ!",
    track: "ਤੁਹਾਡੀ ਟ੍ਰੈਕ ਆਈਡੀ",
    required: "ਕਿਰਪਾ ਕਰਕੇ ਲੋੜੀਂਦੀ ਜਾਣਕਾਰੀ ਭਰੋ ਅਤੇ ਸਹਿਮਤੀ ਦਿਓ।",
    other: "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ",
    words: "ਸ਼ਬਦ",
    sections: {
      "Respondent Details": "ਜਵਾਬ ਦੇਣ ਵਾਲੇ ਦਾ ਵੇਰਵਾ",
      "Local Issues": "ਸਥਾਨਕ ਮੁੱਦੇ",
      "Leadership Opinion": "ਲੀਡਰਸ਼ਿਪ ਬਾਰੇ ਰਾਏ",
      "Political Preferences": "ਰਾਜਨੀਤਿਕ ਪਸੰਦ",
      "Campaign Expectations": "ਚੋਣ ਮੁਹਿੰਮ ਦੀਆਂ ਉਮੀਦਾਂ"
    }
  }
};

function capWords(value, max = 100) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return value;
  return words.slice(0, max).join(" ");
}

function countWords(value = "") {
  return value.trim()
    ? value.trim().split(/\s+/).filter(Boolean).length
    : 0;
}

function OtherField({ value, onChange, lang }) {
  return (
    <div className="survey-other-field">
      <textarea
        rows={3}
        value={value || ""}
        maxLength={2000}
        placeholder={LANG[lang].other}
        onChange={(e) => onChange(capWords(e.target.value, 100))}
      />
      <small>{countWords(value || "")}/100 {LANG[lang].words}</small>
    </div>
  );
}

function Question({
  q,
  value,
  onChange,
  otherValue,
  onOtherChange,
  lang
}) {
  const selected = Array.isArray(value) ? value : [];

  const hasOther =
    (q.type === "radio" && value === "Other") ||
    (q.type === "multi" && selected.includes("Other"));

  const toggle = (option) => {
    const exists = selected.includes(option);

    const next = exists
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    if (q.limit && next.length > q.limit) return;

    onChange(next);

    if (option === "Other" && exists) {
      onOtherChange("");
    }
  };

  return (
    <div className="survey-question">
      <h3>
        {q.title} {q.required && <span>*</span>}
      </h3>

      {q.type === "text" && (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your answer"
        />
      )}

      {q.type === "number" && (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter age"
        />
      )}

      {q.type === "radio" && (
        <div className="survey-options">
          {q.options.map((option) => (
            <label className="survey-option" key={option}>
              <input
                type="radio"
                name={q.id}
                checked={value === option}
                onChange={() => {
                  onChange(option);
                  if (option !== "Other") onOtherChange("");
                }}
              />
              <span>
                {option === "Other" ? "Other" : option}
              </span>
            </label>
          ))}
        </div>
      )}

      {q.type === "radio" && hasOther && (
        <OtherField
          value={otherValue}
          onChange={onOtherChange}
          lang={lang}
        />
      )}

      {q.type === "multi" && (
        <>
          <div className="survey-options">
            {q.options.map((option) => (
              <label className="survey-option" key={option}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span>
                  {option === "Other" ? "Other" : option}
                </span>
              </label>
            ))}
          </div>

          {q.limit && (
            <small>Select up to {q.limit} options.</small>
          )}

          {hasOther && (
            <OtherField
              value={otherValue}
              onChange={onOtherChange}
              lang={lang}
            />
          )}
        </>
      )}

      {q.type === "matrix" && (
        <div className="survey-matrix">
          {q.rows.map((row) => (
            <div className="survey-matrix-row" key={row}>
              <strong>{row}</strong>

              <div className="survey-options">
                {q.options.map((option) => (
                  <label className="survey-option" key={option}>
                    <input
                      type="radio"
                      name={`${q.id}_${row}`}
                      checked={(value || {})[row] === option}
                      onChange={() =>
                        onChange({
                          ...(value || {}),
                          [row]: option
                        })
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {q.type === "group" && (
        <div className="survey-group-fields">
          {q.fields.map((field) => (
            <label key={field.id}>
              {field.label}
              <input
                value={(value || {})[field.id] || ""}
                onChange={(e) =>
                  onChange({
                    ...(value || {}),
                    [field.id]: e.target.value
                  })
                }
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}


function VoiceRecorder({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const reader = new FileReader();
        reader.onloadend = () => onChange(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access was not available. Please allow microphone permission and try again.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="survey-question">
      <h3>Voice Recording (Optional)</h3>
      <p>You can record a voice response if you wish.</p>
      <div className="survey-options">
        {!recording ? (
          <button type="button" onClick={startRecording}>
            {value ? "Record Again" : "Start Voice Recording"}
          </button>
        ) : (
          <button type="button" onClick={stopRecording}>
            Stop Recording
          </button>
        )}
        {value && (
          <button type="button" onClick={() => onChange("")}>
            Delete Recording
          </button>
        )}
      </div>
      {recording && <small>Recording in progress...</small>}
      {error && <div className="survey-error">{error}</div>}
      {value && <audio controls src={value} />}
    </div>
  );
}

export function PublicSurvey() {
  const [answers, setAnswers] = useState({});
  const [lang, setLang] = useState("en");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [voiceRecording, setVoiceRecording] = useState("");

  const t = LANG[lang];

  const sections = useMemo(() => {
    const result = {};

    QUESTIONS.forEach((q) => {
      if (!result[q.section]) result[q.section] = [];
      result[q.section].push(q);
    });

    return result;
  }, []);

  const updateAnswer = (id, value) => {
    setAnswers((previous) => {
      const next = { ...previous, [id]: value };
      const q = QUESTIONS.find((item) => item.id === id);

      if (q?.type === "radio" && value !== "Other") {
        delete next[`${id}_other`];
      }

      if (
        q?.type === "multi" &&
        (!Array.isArray(value) || !value.includes("Other"))
      ) {
        delete next[`${id}_other`];
      }

      return next;
    });
  };

  const updateOther = (id, value) => {
    setAnswers((previous) => ({
      ...previous,
      [`${id}_other`]: capWords(value, 100)
    }));
  };

  const submitSurvey = async (e) => {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError(t.required);
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/api/survey/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: { ...answers, ...(voiceRecording ? { voice_recording: voiceRecording } : {}) },
          consent: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to submit survey.");
      }

      setReceipt(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (receipt) {
    const trackId =
      receipt.track_id ||
      receipt.trackId ||
      receipt.reference ||
      receipt.id ||
      "Submitted";

    return (
      <div className="survey-page">
        <div className="survey-shell">
          <div className="survey-hero">
            <div className="survey-brand">LokPulseIQ AI</div>
            <h1>{t.success}</h1>
            <p>{t.track}</p>
            <h2>{trackId}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page">
      <div className="survey-shell">
        <header className="survey-hero">
          <div className="survey-brand">LokPulseIQ AI</div>

          <h1>{t.heading}</h1>
          <p>{t.subtitle}</p>

          <div className="survey-language">
            <button type="button" onClick={() => setLang("en")}>
              English
            </button>
            <button type="button" onClick={() => setLang("hi")}>
              हिन्दी
            </button>
            <button type="button" onClick={() => setLang("pa")}>
              ਪੰਜਾਬੀ
            </button>
          </div>
        </header>

        <form onSubmit={submitSurvey}>
          {Object.entries(sections).map(([section, questions]) => (
            <section className="survey-section" key={section}>
              <h2>{t.sections[section] || section}</h2>

              {questions.map((q) => (
                <Question
                  key={q.id}
                  q={q}
                  value={answers[q.id]}
                  onChange={(value) => updateAnswer(q.id, value)}
                  otherValue={answers[`${q.id}_other`]}
                  onOtherChange={(value) => updateOther(q.id, value)}
                  lang={lang}
                />
              ))}
            </section>
          ))}

          <VoiceRecorder value={voiceRecording} onChange={setVoiceRecording} />

          <div className="survey-consent">
            <label>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              {t.consent}
            </label>
          </div>

          {error && (
            <div className="survey-error">{error}</div>
          )}

          <button
            className="survey-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SurveyAdmin() {
  const [data, setData] = useState(null);

  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem("survey_admin_key") || ""
  );

  const [inputKey, setInputKey] = useState(adminKey);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async (key = adminKey) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/survey/admin`, {
        headers: {
          "X-Admin-Key": key
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to load admin data.");
      }

      setData(result);
      setAdminKey(key);
      localStorage.setItem("survey_admin_key", key);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadData(adminKey);
  }, []);

  const responses = Array.isArray(data)
    ? data
    : data?.responses || data?.submissions || [];

  const filtered = responses.filter((item) => {
    const a = item.answers || item;
    const search = filter.toLowerCase();

    return (
      !search ||
      String(item.track_id || item.trackId || item.id || "")
        .toLowerCase().includes(search) ||
      String(a.village_ward || "").toLowerCase().includes(search) ||
      String(a.constituency || "").toLowerCase().includes(search) ||
      String(a.booth_number || "").toLowerCase().includes(search)
    );
  });

  const downloadCSV = () => {
    const allKeys = [
      ...new Set(
        filtered.flatMap((item) =>
          Object.keys(item.answers || item)
        )
      )
    ];

    const headers = [
      "Track ID",
      "Submitted At",
      ...allKeys
    ];

    const rows = filtered.map((item) => {
      const a = item.answers || item;

      return [
        item.track_id || item.trackId || item.id || "",
        item.created_at || item.submitted_at || "",
        ...allKeys.map((key) => {
          const value = a[key];

          return typeof value === "object"
            ? JSON.stringify(value)
            : value ?? "";
        })
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "LokPulse-AI-Public-Opinion-Survey.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="survey-admin">
      <div className="survey-admin-header">
        <div>
          <div className="survey-brand">LokPulseIQ AI</div>
          <h1>LokPulseIQ AI — Survey Admin</h1>
          <p>Research & Analytics Dashboard</p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {!adminKey && (
        <div className="survey-admin-login">
          <h2>Admin Login</h2>

          <input
            type="password"
            placeholder="Enter admin key"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
          />

          <button
            type="button"
            onClick={() => loadData(inputKey)}
            disabled={!inputKey || loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      )}

      {error && (
        <div className="survey-error">{error}</div>
      )}

      {data && (
        <>
          <div className="survey-admin-stats">
            <div className="survey-stat-card">
              <h3>Total Responses</h3>
              <strong>{responses.length}</strong>
            </div>

            <div className="survey-stat-card">
              <h3>Filtered Responses</h3>
              <strong>{filtered.length}</strong>
            </div>
          </div>

          <div className="survey-admin-toolbar">
            <input
              placeholder="Search Track ID, village/ward, constituency or booth..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <button type="button" onClick={downloadCSV}>
              Export CSV
            </button>
          </div>

          <div className="survey-admin-table-wrap">
            <table className="survey-admin-table">
              <thead>
                <tr>
                  <th>Track ID</th>
                  <th>Village / Ward</th>
                  <th>Constituency</th>
                  <th>Booth No.</th>
                  <th>Age</th>
                  <th>Preferred Party</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item, index) => {
                  const a = item.answers || item;

                  return (
                    <tr key={item.track_id || item.id || index}>
                      <td>
                        {item.track_id || item.trackId || item.id || "-"}
                      </td>
                      <td>{a.village_ward || "-"}</td>
                      <td>{a.constituency || "-"}</td>
                      <td>{a.booth_number || "-"}</td>
                      <td>{a.age || "-"}</td>
                      <td>{a.preferred_party || "-"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div className="survey-modal-backdrop">
          <div className="survey-modal">
            <div className="survey-modal-header">
              <h2>Survey Response Details</h2>

              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <p>
              <strong>Track ID:</strong>{" "}
              {selected.track_id ||
                selected.trackId ||
                selected.id ||
                "-"}
            </p>

            {Object.entries(selected.answers || selected).map(
              ([key, value]) => (
                <div className="survey-detail-row" key={key}>
                  <strong>{key.replace(/_/g, " ")}</strong>
                  <span>
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value ?? "-")}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicSurvey;
