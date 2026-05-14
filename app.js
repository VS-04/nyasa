const { useEffect, useMemo, useRef, useState } = React;
const { motion, AnimatePresence } = Motion;
const h = React.createElement;

const ACCESS_KEY = "nyasa-access";
const PASSWORD_STATE_KEY = "nyasa-password-state";
const PASSWORD_LOGS_KEY = "nyasa-password-logs";

const PASSWORDS = {
  "blush-and-breathe": {
    label: "Blush and Breathe",
    oneTime: true,
  },
  "kiss-me-slower": {
    label: "Kiss Me Slower",
    oneTime: true,
  },
  "tiny-heart-thief": {
    label: "Tiny Heart Thief",
    oneTime: true,
  },
  "open-heart-forever": {
    label: "Open Heart Forever",
    oneTime: false,
  },
};

const navItems = [
  ["Start", "hero"],
  ["Apology", "apology"],
  ["Questions", "questions"],
  ["Honesty", "honesty"],
  ["Polaroids", "polaroids"],
  ["Science", "science"],
  ["Ending", "final"],
];

const apologyLines = [
  "I know I've said and done things that hurt you,",
  "and I'm genuinely sorry for that.",
  "Sorry for the things I said to others about you.",
  "Sorry for the misunderstandings.",
  "Sorry for the moments where my actions made things worse instead of better.",
  "Looking back at it now,",
  "a lot of it could've been handled differently.",
];

const questions = [
  "Do you still get annoyed when my notification pops up?",
  "Did you ever think we'd end up like this?",
  "Would one honest conversation fix things?",
  "Should I stop overthinking every interaction?",
  "Be honest... am I at least slightly forgiven?",
];

const answerButtons = ["Maybe", "Depends", "Still deciding", "You talk too much"];

const playfulReplies = {
  Maybe: [
    "I'll take a mathematically non-zero chance.",
    "That sounded almost optimistic. Tiny smile detected.",
  ],
  Depends: [
    "Fair. Variables exist. I respect the data.",
    "Conditional forgiveness. Very Nyasa-coded.",
  ],
  "Still deciding": [
    "The jury is stylishly unavailable.",
    "I'll wait. Dramatically, but softly.",
  ],
  "You talk too much": [
    "Valid criticism. Painfully accurate.",
    "Okay, reducing word count by 3%. Trying to look cute about it.",
  ],
};

const finalReplies = [
  "A tiny door opened. I saw it. Very butterfly coded.",
  "I promise to be less annoying. Slightly. Maybe charmingly.",
  "That website compliment is being saved as evidence.",
  "Understood. Misunderstandings lose one round.",
];

const polaroids = [
  { id: 1, src: "./nyasa-1.jpg", rotate: -6, y: -24, label: "Photo 01" },
  { id: 2, src: "./nyasa-2.jpg", rotate: 4, y: 18, label: "Photo 02" },
  { id: 3, src: "./nyasa-3.jpg", rotate: -2, y: -4, label: "Photo 03" },
];

const scienceLines = [
  "As a PCM student...\nI think we've been taught the wrong science.",
  "We were taught that the Sun is the hottest thing.",
  "But clearly...\nthey've never met Nyasa Sharma.",
  "See?\nEven science struggles to explain you sometimes.",
];

function normalizePassword(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\s_]+/g, "-");
}

function readStorageJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures so the site still works as a static page.
  }
}

function getStoredAccess() {
  return readStorageJson(ACCESS_KEY, null);
}

function setStoredAccess(session) {
  writeStorageJson(ACCESS_KEY, session);
}

function clearStoredAccess() {
  localStorage.removeItem(ACCESS_KEY);
}

function getPasswordState() {
  return readStorageJson(PASSWORD_STATE_KEY, { usedPasswords: {} });
}

function isPasswordUsed(passwordKey) {
  const state = getPasswordState();
  return Boolean(state.usedPasswords?.[passwordKey]);
}

function markPasswordUsed(passwordKey) {
  const state = getPasswordState();
  state.usedPasswords[passwordKey] = {
    usedAt: new Date().toISOString(),
  };
  writeStorageJson(PASSWORD_STATE_KEY, state);
}

function logInteraction(session, action, detail = {}) {
  if (!session?.key) return;

  const logs = readStorageJson(PASSWORD_LOGS_KEY, {});
  const existing = logs[session.key] || {
    passwordKey: session.key,
    label: session.label,
    oneTime: session.oneTime,
    events: [],
  };

  existing.events.push({
    timestamp: new Date().toISOString(),
    action,
    detail,
  });

  logs[session.key] = existing;
  writeStorageJson(PASSWORD_LOGS_KEY, logs);
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ripple(event) {
  if (!event?.currentTarget) return;
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.left = `${event.clientX - rect.left}px`;
  span.style.top = `${event.clientY - rect.top}px`;
  button.appendChild(span);
  setTimeout(() => span.remove(), 700);
}

function MagneticButton({ children, className, onClick, evasive, href, reducedMotion, track }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const canHover = window.matchMedia("(pointer: fine)").matches;
    if (!el || reducedMotion || !canHover) return undefined;

    const move = (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      const strength = evasive ? -0.34 : 0.18;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };

    const leave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);

    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [evasive, reducedMotion]);

  const props = {
    ref,
    className: cx("btn", className),
    onClick: (event) => {
      ripple(event);
      track?.(event);
      onClick?.(event);

      if (href) {
        const target = document.querySelector(href);
        if (window.__lenis && target) window.__lenis.scrollTo(target, { offset: 0 });
        else target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    },
  };

  return h("button", props, children);
}

function ParticleField({ reducedMotion }) {
  const particles = useMemo(() => {
    if (reducedMotion) return [];

    const count = window.matchMedia("(max-width: 720px)").matches ? 18 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      speed: 3.8 + Math.random() * 7,
      dx: `${-35 + Math.random() * 70}px`,
      dy: `${-45 + Math.random() * 90}px`,
      delay: `${Math.random() * -8}s`,
    }));
  }, [reducedMotion]);

  if (!particles.length) return null;

  return h("div", { className: "particle-field", "aria-hidden": true },
    particles.map((particle) => h("span", {
      key: particle.id,
      className: "particle",
      style: {
        left: `${particle.left}%`,
        top: `${particle.top}%`,
        "--speed": `${particle.speed}s`,
        "--dx": particle.dx,
        "--dy": particle.dy,
        animationDelay: particle.delay,
      },
    })),
  );
}

function ButterflyField({ reducedMotion }) {
  const butterflies = useMemo(() => {
    if (reducedMotion) return [];

    const count = window.matchMedia("(max-width: 720px)").matches ? 5 : 8;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      top: 18 + Math.random() * 74,
      delay: `${Math.random() * -9}s`,
      speed: `${7 + Math.random() * 8}s`,
      size: `${15 + Math.random() * 18}px`,
    }));
  }, [reducedMotion]);

  if (!butterflies.length) return null;

  return h("div", { className: "butterfly-field", "aria-hidden": true },
    butterflies.map((butterfly) => h("span", {
      key: butterfly.id,
      className: "butterfly",
      style: {
        left: `${butterfly.left}%`,
        top: `${butterfly.top}%`,
        width: butterfly.size,
        height: butterfly.size,
        animationDuration: butterfly.speed,
        animationDelay: butterfly.delay,
      },
    })),
  );
}

function AmbientOrbs() {
  return h("div", { className: "ambient-orbs", "aria-hidden": true },
    [0, 1, 2].map((id) => h("span", { key: id, className: `ambient-orb orb-${id + 1}` })),
  );
}

function Loader() {
  return h(motion.div, {
    className: "loader",
    initial: { opacity: 1 },
    animate: { opacity: 0, pointerEvents: "none" },
    transition: { delay: 1.05, duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  }, h("div", { className: "loader-mark" }));
}

function AccessGate({ onAuthenticated }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("auth-locked");
    return () => document.body.classList.remove("auth-locked");
  }, []);

  useEffect(() => {
    const session = getStoredAccess();
    if (session?.key && PASSWORDS[session.key]) {
      onAuthenticated(session);
      return;
    }
    clearStoredAccess();
    setLoading(false);
  }, [onAuthenticated]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!password.trim()) {
      setError("Enter password");
      return;
    }

    setSubmitting(true);
    setError("");

    const passwordKey = normalizePassword(password);
    const profile = PASSWORDS[passwordKey];

    if (!profile) {
      setError("Wrong password");
      setSubmitting(false);
      return;
    }

    if (profile.oneTime && isPasswordUsed(passwordKey)) {
      setError("This password was already used on this device.");
      setSubmitting(false);
      return;
    }

    if (profile.oneTime) {
      markPasswordUsed(passwordKey);
    }

    const session = {
      key: passwordKey,
      label: profile.label,
      oneTime: profile.oneTime,
      grantedAt: new Date().toISOString(),
    };

    setStoredAccess(session);
    logInteraction(session, "access_granted", {
      passwordKey,
      label: profile.label,
      oneTime: profile.oneTime,
    });
    onAuthenticated(session);
    setSubmitting(false);
  };

  return h("main", { className: "access-shell" },
    h("div", { className: "access-backdrop", "aria-hidden": true }),
    h("section", { className: "access-panel glass-panel" },
      h("h1", { className: "access-title" }, "Enter password"),
      h("form", { className: "access-form", onSubmit: handleSubmit },
        h("input", {
          id: "site-password",
          className: "access-input",
          type: "password",
          autoComplete: "off",
          placeholder: "Enter password",
          value: password,
          disabled: loading || submitting,
          onChange: (event) => setPassword(event.target.value),
        }),
        h("button", {
          className: "btn primary access-submit",
          type: "submit",
          disabled: loading || submitting,
        }, loading ? "Checking..." : submitting ? "Entering..." : "Enter"),
      ),
      error && h("p", { className: "access-error" }, error),
    ),
  );
}

function Navbar({ light, setLight, soundOn, toggleSound, trackInteraction }) {
  return h(motion.nav, {
    className: "nav",
    initial: { y: -70, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
    h("div", { className: "brand-wrap" },
      h("div", { className: "brand" }, "For Nyasa Sharma"),
    ),
    h("div", { className: "nav-links" },
      navItems.map(([label, id]) => h("a", {
        key: id,
        href: `#${id}`,
        onClick: () => trackInteraction("nav_jump", { target: id, label }),
      }, label)),
    ),
    h("div", { className: "control-group" },
      h("button", {
        className: "icon-btn",
        title: soundOn ? "Ambient audio on" : "Ambient audio off",
        onClick: () => {
          trackInteraction("toggle_audio", { enabled: !soundOn });
          toggleSound();
        },
        "aria-label": "Toggle ambient audio",
      }, soundOn ? "ON" : "OFF"),
      h("button", {
        className: "icon-btn",
        title: light ? "Switch to dark mode" : "Switch to light mode",
        onClick: () => {
          trackInteraction("toggle_theme", { mode: light ? "dark" : "light" });
          setLight((value) => !value);
        },
        "aria-label": "Toggle theme",
      }, light ? "Moon" : "Sun"),
    ),
  );
}

function Hero({ reducedMotion, trackInteraction }) {
  return h("section", { id: "hero", className: "section" },
    h(motion.div, {
      className: "hero-orbit parallax",
      "data-speed": "-0.16",
      initial: { opacity: 0, scale: 0.82 },
      animate: { opacity: 0.72, scale: 1 },
      transition: { delay: 0.5, duration: 1.4, ease: [0.22, 1, 0.36, 1] },
    }),
    h("div", { className: "section-inner" },
      h(motion.p, {
        className: "eyebrow",
        initial: { y: 24, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 1.1, duration: 0.7 },
      }, "Not a grand speech. Just a softer one."),
      h(motion.h1, {
        className: "cinematic-title",
        initial: { y: 46, opacity: 0, scale: 0.985 },
        animate: { y: 0, opacity: 1, scale: 1 },
        transition: { delay: 1.25, duration: 0.95, ease: [0.22, 1, 0.36, 1] },
      }, "Nyasa... can we clear things out?"),
      h(motion.p, {
        className: "lead mt-8",
        initial: { y: 34, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 1.55, duration: 0.85 },
      }, "I've been wanting to say a few things properly instead of letting misunderstandings speak for me. And maybe make you smile a little while I'm at it."),
      h(motion.div, {
        className: "button-row",
        initial: { y: 24, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 1.8, duration: 0.8 },
      },
        h(MagneticButton, {
          className: "primary",
          href: "#apology",
          reducedMotion,
          track: () => trackInteraction("hero_cta", { label: "Continue" }),
        }, "Continue"),
        h(MagneticButton, {
          evasive: true,
          href: "#questions",
          reducedMotion,
          track: () => trackInteraction("hero_cta", { label: "Or Ignore Me Dramatically" }),
        }, "Or Ignore Me Dramatically"),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function Apology() {
  return h("section", { id: "apology", className: "section apology-section" },
    h("div", { className: "section-inner" },
      h("p", { className: "eyebrow reveal" }, "The actual apology, with a softer tone"),
      h("div", { className: "apology-lines" },
        apologyLines.map((line, index) => h("div", {
          key: line,
          className: "apology-line",
          style: { transitionDelay: `${index * 90}ms` },
        }, line)),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function QuestionCard({ question, index, onAnswer, reducedMotion }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const canHover = window.matchMedia("(pointer: fine)").matches;
    if (!el || reducedMotion || !canHover) return undefined;

    const move = (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-5px)`;
    };

    const leave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);

    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [reducedMotion]);

  return h(motion.article, {
    ref,
    className: "question-card glass-panel",
    initial: { opacity: 0, y: 40, scale: 0.96 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.35 },
    transition: { delay: index * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
    h("span", { className: "text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]" }, `Question 0${index + 1}`),
    h("h3", null, question),
    h("div", { className: "answer-bank" },
      answerButtons.map((answer) => h("button", {
        key: answer,
        className: "mini-btn",
        onClick: (event) => {
          ripple(event);
          onAnswer(answer, event);
        },
      }, answer)),
    ),
  );
}

function Questions({ addReply, trackInteraction, reducedMotion }) {
  return h("section", { id: "questions", className: "section" },
    h("div", { className: "section-inner" },
      h("p", { className: "eyebrow reveal" }, "Tiny cross-examination"),
      h("h2", { className: "text-4xl md:text-7xl font-extrabold leading-none max-w-4xl reveal" }, "A few questions, asked with suspiciously calm confidence and a cute amount of hope."),
      h("div", { className: "question-grid mt-12" },
        questions.map((question, index) => h(QuestionCard, {
          key: question,
          question,
          index,
          reducedMotion,
          onAnswer: (answer, event) => {
            trackInteraction("question_answer", {
              questionIndex: index + 1,
              question,
              answer,
            });
            const replies = playfulReplies[answer];
            addReply(replies[Math.floor(Math.random() * replies.length)], event.clientX, event.clientY);
          },
        })),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function Honesty() {
  return h("section", { id: "honesty", className: "section" },
    h("div", { className: "section-inner" },
      h("div", { className: "rain-pane glass-panel reveal" },
        h("p", { className: "eyebrow" }, "Honest thoughts"),
        h("div", { className: "honest-copy" },
          h("p", null, "I also want to be honest about something."),
          h("p", { className: "mt-8" }, "I know there are things you haven't told me, and things regarding me that I ended up finding out myself."),
          h("p", { className: "mt-8 text-[color:var(--muted)]" }, "But I never brought them up because I didn't want things between us to get worse."),
          h("p", { className: "mt-8" }, "Sometimes I ask questions even when I already know the answer, and getting lied to directly hurts more than simply hearing the truth."),
          h("p", { className: "mt-8 text-[color:var(--accent)]" }, "I'm not asking for perfection. Just honesty."),
        ),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function PolaroidCard({ item, index, reducedMotion }) {
  const ref = useRef(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const canHover = window.matchMedia("(pointer: fine)").matches;
    if (!el || reducedMotion || !canHover) return undefined;

    const move = (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", `${-y * 7}deg`);
      el.style.setProperty("--tilt-y", `${x * 8}deg`);
      el.style.setProperty("--shift-x", `${x * 10}px`);
      el.style.setProperty("--shift-y", `${y * 10}px`);
    };

    const leave = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--shift-x", "0px");
      el.style.setProperty("--shift-y", "0px");
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);

    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [reducedMotion]);

  return h(motion.figure, {
    ref,
    className: "polaroid-card reveal",
    style: {
      "--rotate": `${item.rotate}deg`,
      "--lift": `${item.y}px`,
      "--delay": `${index * -1.4}s`,
    },
    initial: { opacity: 0, y: 48, scale: 0.96 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.35 },
    transition: { duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] },
  },
    h("div", { className: "polaroid-image-wrap" },
      !missing && h("img", {
        src: item.src,
        alt: `Nyasa Sharma ${item.label}`,
        loading: "lazy",
        decoding: "async",
        onError: () => setMissing(true),
      }),
      missing && h("div", { className: "polaroid-placeholder" },
        h("span", null, item.label),
        h("small", null, "Replace with Nyasa's picture"),
      ),
    ),
    h("figcaption", null, "unfairly good"),
  );
}

function PolaroidShowcase({ reducedMotion }) {
  return h("section", { id: "polaroids", className: "section polaroid-section" },
    h("div", { className: "section-inner" },
      h("p", { className: "eyebrow reveal" }, "Small unfair advantage"),
      h("h2", { className: "polaroid-title reveal" }, "Okay... you do make the website look better."),
      h("div", { className: "polaroid-stage" },
        polaroids.map((item, index) => h(PolaroidCard, { key: item.id, item, index, reducedMotion })),
      ),
      h("p", { className: "polaroid-note reveal" }, "I still think these pictures are unfairly good."),
    ),
    h("div", { className: "wave" }),
  );
}

function ScienceSection({ trackInteraction, reducedMotion }) {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let cursor = 0;
    setTyped("");

    if (reducedMotion) {
      setTyped(scienceLines[step]);
      return undefined;
    }

    const interval = setInterval(() => {
      cursor += 1;
      setTyped(scienceLines[step].slice(0, cursor));
      if (cursor >= scienceLines[step].length) clearInterval(interval);
    }, step === 2 ? 28 : 34);

    return () => clearInterval(interval);
  }, [reducedMotion, step]);

  const next = () => {
    trackInteraction("science_step", {
      fromStep: step,
      toStep: Math.min(step + 1, 3),
    });

    if (step === 2 && !reducedMotion) {
      document.body.animate([
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(0)" },
      ], { duration: 240 });
    }

    setStep((value) => Math.min(value + 1, 3));
  };

  return h("section", { id: "science", className: "section" },
    h("div", { className: "section-inner" },
      h("p", { className: "eyebrow reveal" }, "Hidden file: Scientific Discovery"),
      h("div", { className: cx("science-stage glass-panel reveal", step === 2 && "heatwave") },
        h("div", { className: "science-grid" }),
        ["DNyasa > DSun", "PCM != Prepared Calm Mind", "Q = mc(Nyasa mood)", "angerC -> undefined", "truth > drama"].map((formula, i) =>
          h("span", {
            key: formula,
            className: "formula",
            style: {
              left: `${8 + (i * 19) % 80}%`,
              top: `${14 + (i * 17) % 64}%`,
              animationDelay: `${i * -0.7}s`,
            },
          }, formula),
        ),
        h(AnimatePresence, { mode: "wait" },
          h(motion.div, {
            key: step,
            className: "science-copy",
            initial: { opacity: 0, y: 34, scale: 0.975 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: -24, scale: 1.015 },
            transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
          },
            h("h2", { className: "type-text whitespace-pre-line" }, typed),
            step === 2 && h("div", { className: "heat-wrap" },
              h("p", { className: "lead mx-auto" }, "Because somehow, your anger reaches temperatures physics still can't explain."),
              h("div", { className: "meter" }, h("div", { className: "meter-fill" })),
              h("div", { className: "alert" }, "temperature exceeded"),
            ),
            step === 3 && h("p", { className: "lead mx-auto mt-8" }, "Unexpected. Accurate. Slightly dangerous."),
            step < 3 && h("div", { className: "button-row justify-center" },
              h(MagneticButton, {
                className: "primary",
                onClick: next,
                reducedMotion,
                track: () => trackInteraction("science_button", {
                  label: step === 0 ? "Why?" : step === 1 ? "But?" : "Okay okay, calm down",
                }),
              }, step === 0 ? "Why?" : step === 1 ? "But?" : "Okay okay, calm down"),
            ),
          ),
        ),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function LighterEnding({ addReply, trackInteraction, reducedMotion }) {
  return h("section", { id: "lighter", className: "section" },
    h("div", { className: "section-inner" },
      h("p", { className: "eyebrow reveal" }, "Breathing room"),
      h("h2", { className: "text-5xl md:text-8xl font-extrabold leading-none max-w-5xl reveal" }, "Anyway... this website became way more dramatic than I originally planned."),
      h("p", { className: "lead mt-8 reveal" }, "But if you've read this far, I'm assuming you don't completely hate me yet. Maybe there's even one tiny butterfly pretending to be neutral."),
      h("div", { className: "button-row reveal" },
        ["Fair Point", "Still Processing", "You're Lucky This Website Looks Cool"].map((label) =>
          h(MagneticButton, {
            key: label,
            reducedMotion,
            track: () => trackInteraction("lighter_ending", { label }),
            onClick: (event) => addReply(label === "Fair Point" ? "A fair point has entered the chat." : label, event.clientX, event.clientY),
          }, label),
        ),
      ),
    ),
    h("div", { className: "wave" }),
  );
}

function FinalSection({ addReply, trackInteraction, reducedMotion }) {
  const [done, setDone] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const finalLines = [
    "Thanks for reading this till the end, Nyasa.",
    "No matter what happens,",
    "I genuinely hope things get better between us.",
    "And for the record...",
    "you still look cute when you're annoyed.",
  ];

  useEffect(() => {
    if (!done) return undefined;

    setVisibleLines(0);

    if (reducedMotion) {
      setVisibleLines(finalLines.length);
      document.body.classList.add("ending-calm");
      return () => document.body.classList.remove("ending-calm");
    }

    const delays = [450, 1250, 2050, 3500, 4300];
    const timers = delays.map((delay, index) => setTimeout(() => setVisibleLines(index + 1), delay));
    const calm = setTimeout(() => document.body.classList.add("ending-calm"), 500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(calm);
      document.body.classList.remove("ending-calm");
    };
  }, [done, finalLines.length, reducedMotion]);

  return h("section", { id: "final", className: "section" },
    h("div", { className: "section-inner ending-panel" },
      h("p", { className: "eyebrow reveal" }, "One last thing"),
      h("h2", { className: "reveal" }, "So... Can we stop letting misunderstandings win?"),
      h("div", { className: "button-row justify-center reveal" },
        ["Maybe", "We'll See", "Only If You Stop Being Annoying"].map((label, index) =>
          h(MagneticButton, {
            key: label,
            className: index === 0 ? "primary" : "",
            reducedMotion,
            track: () => trackInteraction("final_answer", { label }),
            onClick: (event) => {
              addReply(finalReplies[index], event.clientX, event.clientY);
              setDone(true);
              if (!reducedMotion) {
                gsap.fromTo(".mesh", { scale: 1.04, opacity: 0.86 }, { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" });
              }
            },
          }, label),
        ),
      ),
      h(AnimatePresence, null,
        done && h(motion.div, {
          className: "final-message",
          initial: { opacity: 0, y: 28, scale: 0.985 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        },
          finalLines.map((line, index) => h(motion.p, {
            key: line,
            className: index > 2 ? "final-tease" : "",
            initial: { opacity: 0, y: 18 },
            animate: visibleLines > index ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
            transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
          }, line)),
        ),
      ),
    ),
  );
}

function FloatingReplies({ replies }) {
  return h(AnimatePresence, null,
    replies.map((reply) => h(motion.div, {
      key: reply.id,
      className: "floating-reply",
      style: { left: reply.x, top: reply.y },
      initial: { opacity: 0, y: 10, scale: 0.84 },
      animate: { opacity: 1, y: -58, scale: 1 },
      exit: { opacity: 0, y: -95, scale: 0.96 },
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    }, reply.text)),
  );
}

function Experience({ access }) {
  const reducedMotion = useReducedMotionPreference();
  const [light, setLight] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [replies, setReplies] = useState([]);
  const [flutter, setFlutter] = useState([]);
  const audioRef = useRef(null);
  const lastFlutter = useRef(0);

  const trackInteraction = (action, detail = {}) => {
    logInteraction(access, action, detail);
  };

  useEffect(() => {
    document.body.classList.toggle("light", light);
    document.body.classList.add("theme-morphing");
    const timer = setTimeout(() => document.body.classList.remove("theme-morphing"), 850);
    return () => clearTimeout(timer);
  }, [light]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const root = document.documentElement;
    let frame = 0;
    const move = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const dx = (event.clientX / window.innerWidth - 0.5).toFixed(4);
        const dy = (event.clientY / window.innerHeight - 0.5).toFixed(4);
        root.style.setProperty("--glow-x", `${event.clientX}px`);
        root.style.setProperty("--glow-y", `${event.clientY}px`);
        root.style.setProperty("--cursor-dx", dx);
        root.style.setProperty("--cursor-dy", dy);
      });
    };

    window.addEventListener("pointermove", move);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !window.Lenis) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    window.__lenis = lenis;
    let active = true;
    let frame = 0;

    const raf = (time) => {
      if (!active) return;
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      lenis.destroy();
      window.__lenis = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const onScroll = () => {
      const now = performance.now();
      if (now - lastFlutter.current < 520) return;
      lastFlutter.current = now;

      const id = `${now}-${Math.random()}`;
      const x = 18 + Math.random() * Math.max(window.innerWidth - 36, 40);
      const y = 92 + Math.random() * Math.min(window.innerHeight * 0.58, 500);
      setFlutter((items) => [...items.slice(-5), { id, x, y }]);
      setTimeout(() => setFlutter((items) => items.filter((item) => item.id !== id)), 2400);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.2,
      },
    });

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 34, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.82,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        },
      );
    });

    gsap.utils.toArray(".apology-line").forEach((line) => {
      gsap.to(line, {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: line,
          start: "top 82%",
          end: "top 42%",
          scrub: true,
        },
      });
    });

    gsap.utils.toArray(".parallax").forEach((el) => {
      const speed = Number(el.dataset.speed || 0.1);
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: { trigger: el.closest(".section"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, [reducedMotion]);

  useEffect(() => () => {
    if (!audioRef.current) return;
    audioRef.current.oscA.stop();
    audioRef.current.oscB.stop();
    audioRef.current.rain.stop();
    audioRef.current.ctx.close();
    audioRef.current = null;
  }, []);

  const toggleSound = () => {
    if (soundOn && audioRef.current) {
      audioRef.current.gain.gain.exponentialRampToValueAtTime(0.0001, audioRef.current.ctx.currentTime + 0.4);
      setTimeout(() => {
        audioRef.current?.oscA.stop();
        audioRef.current?.oscB.stop();
        audioRef.current?.rain.stop();
        audioRef.current?.ctx.close();
        audioRef.current = null;
      }, 520);
      setSoundOn(false);
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const rain = ctx.createBufferSource();
    const rainGain = ctx.createGain();
    const rainFilter = ctx.createBiquadFilter();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.18;

    oscA.frequency.value = 92;
    oscB.frequency.value = 138;
    rain.buffer = buffer;
    rain.loop = true;
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 980;
    rainGain.gain.value = 0.018;
    filter.type = "lowpass";
    filter.frequency.value = 540;
    gain.gain.value = 0.0001;
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    rain.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(gain);
    gain.connect(ctx.destination);
    oscA.start();
    oscB.start();
    rain.start();
    gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.8);
    audioRef.current = { ctx, gain, oscA, oscB, rain };
    setSoundOn(true);
  };

  const addReply = (text, x, y) => {
    const id = `${Date.now()}-${Math.random()}`;
    setReplies((items) => [...items, { id, text, x, y }]);
    setTimeout(() => setReplies((items) => items.filter((item) => item.id !== id)), 1800);
  };

  return h("div", { className: "app-shell" },
    h("div", { className: "mesh", "aria-hidden": true }),
    h("div", { className: "rays", "aria-hidden": true }),
    h(AmbientOrbs),
    h(ParticleField, { reducedMotion }),
    h(ButterflyField, { reducedMotion }),
    h("div", { className: "cursor-glow", "aria-hidden": true }),
    h(motion.div, { className: "progress", initial: { scaleX: 0 } }),
    h(Loader),
    h(Navbar, {
      light,
      setLight,
      soundOn,
      toggleSound,
      trackInteraction,
    }),
    h(Hero, { reducedMotion, trackInteraction }),
    h(Apology),
    h(Questions, { addReply, trackInteraction, reducedMotion }),
    h(Honesty),
    h(PolaroidShowcase, { reducedMotion }),
    h(ScienceSection, { trackInteraction, reducedMotion }),
    h(LighterEnding, { addReply, trackInteraction, reducedMotion }),
    h(FinalSection, { addReply, trackInteraction, reducedMotion }),
    h(FloatingReplies, { replies }),
    h(AnimatePresence, null,
      flutter.map((item) => h(motion.span, {
        key: item.id,
        className: "scroll-flutter",
        style: { left: item.x, top: item.y },
        initial: { opacity: 0, y: 22, scale: 0.5, rotate: -18 },
        animate: { opacity: [0, 0.9, 0.75, 0], y: -120, x: [0, 22, -14, 18], scale: [0.55, 1, 0.88], rotate: [0, 14, -10, 18] },
        exit: { opacity: 0 },
        transition: { duration: 2.2, ease: "easeOut" },
      })),
    ),
  );
}

function App() {
  const [access, setAccess] = useState(null);

  if (!access) {
    return h(AccessGate, { onAuthenticated: setAccess });
  }

  return h(Experience, { access });
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
