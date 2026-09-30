'use client';

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreateProduct.module.css";

const classLibrary = [
  "Trucker","Bus","Business Auto","Taxi","Limousine","Ambulance",
  "Delivery Vehicle","Contractor Vehicle","Public Auto","School Bus",
  "Motor Carrier","Tow Truck","Rental Vehicle","Farm Vehicle","Emergency Vehicle"
];

const coverageMap = {
  Trucker: ["Auto Liability","Motor Truck Cargo","Physical Damage"],
  Bus: ["Auto Liability","Physical Damage","Medical Payments"],
  "Business Auto": ["Auto Liability","Physical Damage","Hired & Non-Owned Auto"]
};

const coverageLibrary = [
  "Auto Liability","Motor Truck Cargo","Physical Damage","General Liability",
  "Medical Payments","Hired & Non-Owned Auto",
  "Trailer Interchange","Non-Trucking Liability","Garagekeepers Liability",
  "Rental Reimbursement","Towing and Labor"
];

const additionalCoverageMap = {
  "Auto Liability": ["Uninsured Motorist", "Underinsured Motorist", "Medical Payments", "PIP"],
  "Motor Truck Cargo": ["Reefer Breakdown", "Earned Freight", "Debris Removal"],
  "Physical Damage": ["Collision", "Comprehensive / Other Than Collision", "Specified Causes of Loss"],
  "Hired & Non-Owned Auto": ["Hired Auto Liability", "Non-Owned Auto Liability", "Hired Auto Physical Damage"],
  "Garagekeepers Liability": ["Comprehensive", "Collision", "Specified Causes of Loss"]
};

const coverageDescriptions = {
  "Auto Liability": "Third-party liability coverage",
  "Motor Truck Cargo": "Protection for cargo being transported",
  "Physical Damage": "First-party vehicle damage"
};

function CoverageIcon({ coverage }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {coverage === "Motor Truck Cargo" ? <>
        <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" />
        <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
      </> : coverage === "Physical Damage" ? <>
        <path d="m5 7 2-3h10l2 3 2 3v8h-3v-2H6v2H3v-8l2-3ZM5 7h14M3 11h18M6 13h2M16 13h2" />
      </> : <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6" />}
    </svg>
  );
}

function MainCoverageCard({ className, coverage, additionalCoverages, onRemove, onAddAdditional, onRemoveAdditional, expanded, onToggle }) {
  const panelId = useId();
  const [value, setValue] = useState("");
  const configured = additionalCoverageMap[coverage] || [];
  const available = configured.filter((item) => !additionalCoverages.includes(item));

  return (
    <div className={styles.coverageCard}>
      <div className={styles.coverageHeader}>
        <button type="button" className={styles.coverageToggle} aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
          <span className={styles.coverageIcon}><CoverageIcon coverage={coverage} /></span>
          <span className={styles.coverageTitle}>
            <strong>{coverage}</strong>
            {coverageDescriptions[coverage] && <small>{coverageDescriptions[coverage]}</small>}
          </span>
          <span className={styles.coverageCount}>{additionalCoverages.length} additional</span>
          <svg className={styles.coverageChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d={expanded ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
          </svg>
        </button>
        <button type="button" className={styles.coverageRemove} aria-label={`Remove ${coverage} from ${className}`} onClick={onRemove}>
          &times;
        </button>
      </div>
      <div id={panelId} className={styles.coverageBody} hidden={!expanded}>
        <div className="cp-label">Additional coverages</div>
        {configured.length ? (
          <>
            <div className="cp-tagwrap">
              {additionalCoverages.length ? additionalCoverages.map((item) => (
                <span className="cp-tag" key={item}>
                  {item}
                  <button type="button" aria-label={`Remove ${item} from ${coverage}`} onClick={() => onRemoveAdditional(item)}>&times;</button>
                </span>
              )) : <small className={styles.coverageHint}>No additional coverages selected.</small>}
            </div>
            <div className="cp-addcoverage">
              <select value={value} aria-label={`Additional coverage library for ${coverage} in ${className}`} onChange={(event) => setValue(event.target.value)}>
                <option value="">Choose additional coverage</option>
                {available.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={() => {
                onAddAdditional(value);
                setValue("");
              }}>+ Add additional</button>
            </div>
          </>
        ) : <small className={styles.coverageHint}>No additional coverages configured for this coverage.</small>}
      </div>
    </div>
  );
}

const carriers = [
  "Southlake Specialty Insurance Company",
  "Futuristic Risk Carrier",
  "Northstar Casualty Company"
];

export default function CreateProduct({ onBack }) {
  const router = useRouter();
  const [carrier, setCarrier] = useState("");
  const [name, setName] = useState("");
  const [lob, setLob] = useState("");
  const [chosenClasses, setChosenClasses] = useState([]);
  const [selectedCoverage, setSelectedCoverage] = useState({});
  const [activeClass, setActiveClass] = useState("");
  const [expandedCoverages, setExpandedCoverages] = useState({});
  const [arrangement, setArrangement] = useState("");
  const [classLibraryValue, setClassLibraryValue] = useState("");
  const [coverageLibraryValue, setCoverageLibraryValue] = useState("");
  const [toast, setToast] = useState("");

  const selectedClasses = chosenClasses;

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2200);
  };

  const addClass = () => {
    const value = classLibraryValue;
    if (!value) {
      showToast("Choose class from library.");
      return;
    }

    if (chosenClasses.includes(value)) return;
    setChosenClasses((current) => [...current, value]);
    setSelectedCoverage((current) => ({
      ...current,
      [value]: Object.fromEntries((coverageMap[value] || []).map((coverage) => [coverage, []]))
    }));
    setCoverageLibraryValue("");
    setExpandedCoverages((current) => ({ ...current, [value]: coverageMap[value]?.[0] || null }));
    setActiveClass(value);
    setClassLibraryValue("");
  };

  const removeClass = (className) => {
    setExpandedCoverages((current) => {
      const next = { ...current };
      delete next[className];
      return next;
    });
    setCoverageLibraryValue("");
    setChosenClasses((current) =>
      current.filter((item) => item !== className)
    );

    setSelectedCoverage((current) => {
      const next = { ...current };
      delete next[className];
      return next;
    });

    setActiveClass((current) => {
      if (current !== className) return current;
      const remaining = chosenClasses.filter((item) => item !== className);
      return remaining[0] || "";
    });
  };

  const addCoverage = () => {
    if (!activeClass || !coverageLibraryValue) {
      showToast("Choose coverage from library.");
      return;
    }

    if (!coverageLibrary.includes(coverageLibraryValue)) return;
    setExpandedCoverages((current) => ({ ...current, [activeClass]: coverageLibraryValue }));
    setSelectedCoverage((current) => {
      const existing = current[activeClass] || {};
      if (Object.hasOwn(existing, coverageLibraryValue)) return current;
      return { ...current, [activeClass]: { ...existing, [coverageLibraryValue]: [] } };
    });
    setCoverageLibraryValue("");
  };

  const removeCoverage = (className, coverage) => {
    setExpandedCoverages((current) => current[className] === coverage
      ? { ...current, [className]: null }
      : current);

    setSelectedCoverage((current) => {
      const next = { ...current[className] };
      delete next[coverage];
      return { ...current, [className]: next };
    });
  };

  const addAdditionalCoverage = (className, coverage, additional) => {
    if (!(additionalCoverageMap[coverage] || []).includes(additional)) {
      showToast("Choose additional coverage from library.");
      return;
    }
    setSelectedCoverage((current) => {
      const existing = current[className]?.[coverage];
      if (!existing || existing.includes(additional)) return current;
      return {
        ...current,
        [className]: { ...current[className], [coverage]: [...existing, additional] }
      };
    });
  };

  const removeAdditionalCoverage = (className, coverage, additional) => {
    setSelectedCoverage((current) => {
      const existing = current[className]?.[coverage];
      if (!existing) return current;
      return {
        ...current,
        [className]: { ...current[className], [coverage]: existing.filter((item) => item !== additional) }
      };
    });
  };

  const currentCoverage = Object.keys(selectedCoverage[activeClass] || {});

  const availableCoverage = coverageLibrary.filter(
    (item) => !currentCoverage.includes(item)
  );

  const remainingClasses = classLibrary.filter(
    (item) => !chosenClasses.includes(item)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    let ok = true;

    if (!carrier) ok = false;
    if (!name.trim()) ok = false;
    if (!lob) ok = false;

    if (!selectedClasses.length) {
      ok = false;
    }

    if (!arrangement) {
      ok = false;
    }

    if (!ok) {
      showToast("Complete required fields.");
      return;
    }

    const payload = {
      name,
      carrier,
      lineOfBusiness: lob,
      arrangement,
      selectedClasses: chosenClasses,
      coverages: selectedCoverage,
      status: "Draft",
      createdOn: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const created = await res.json();
      router.push(`/products/${created.id}`);
    } catch {
      showToast("Failed to save product. Please try again.");
    }
  };

  return (
    <div className={styles.page}>

      <div className="create-product-page">
        <div className="cp-main">
          <div className="cp-crumb">
            Products / <b>Create product</b>
          </div>

          <div className="cp-pagehead">
            <div>
              <h1>Create insurance product</h1>
              <p>
                Define product ownership, eligible vehicle classes, coverages,
                and arrangement.
              </p>
            </div>
            <span className="cp-badge">Draft</span>
          </div>

          <div className="cp-layout">
            <form className="cp-card cp-formcard" onSubmit={handleSubmit}>
              <section className="cp-section">
                <div className="cp-sectitle">
                  <div className="cp-num">1</div>
                  <div>
                    <h2>Product details</h2>
                    <p>Identify carrier and product.</p>
                  </div>
                </div>

                <div className="cp-grid2">
                  <div className="cp-field">
                    <label htmlFor="carrier">
                      Carrier <span className="cp-required">*</span>
                    </label>
                    <select
                      id="carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    >
                      <option value="">Select carrier</option>
                      {carriers.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cp-field">
                    <label htmlFor="name">
                      Product name <span className="cp-required">*</span>
                    </label>
                    <input
                      id="name"
                      maxLength={80}
                      placeholder="Example: Commercial Auto Select"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="cp-field" style={{ gridColumn:"1 / -1" }}>
                    <label htmlFor="lob">
                      Line of business <span className="cp-required">*</span>
                    </label>
                    <select
                      id="lob"
                      value={lob}
                      onChange={(e) => setLob(e.target.value)}
                    >
                      <option value="">Select line of business</option>
                      <option>Commercial Auto</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="cp-section">
                <div className="cp-sectitle">
                  <div className="cp-num">2</div>
                  <div>
                    <h2>Classes and coverages</h2>
                    <p>
                      Add classes from library. Configure one class at time to
                      keep screen compact.
                    </p>
                  </div>
                </div>

                <label className="cp-label" htmlFor="classLibrary">
                  Add class from library
                </label>

                <div className="cp-classpicker">
                  <select
                    id="classLibrary"
                    value={classLibraryValue}
                    onChange={(e) => setClassLibraryValue(e.target.value)}
                  >
                    <option value="">Choose class</option>
                    {remainingClasses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <button type="button" onClick={addClass}>
                    + Add class
                  </button>
                </div>

                <div className="cp-selectedlabel">
                  <b>Selected classes</b>
                  <span>
                    {selectedClasses.length} class
                    {selectedClasses.length === 1 ? "" : "es"} selected
                  </span>
                </div>

                <div className="cp-classtabs">
                  {selectedClasses.map((className) => (
                    <button
                      type="button"
                      key={className}
                      className={`cp-classtab ${
                        className === activeClass ? "active" : ""
                      }`}
                      onClick={() => {
                        setActiveClass(className);
                        setCoverageLibraryValue("");
                      }}
                    >
                      {className} · {Object.keys(selectedCoverage[className] || {}).length}
                    </button>
                  ))}
                </div>

                {!selectedClasses.length ? (
                  <div className="cp-empty">
                    <span className="cp-empty-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3 9 5-9 5-9-5 9-5Z"/>
                        <path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>
                      </svg>
                    </span>
                    Add class above to configure coverages.
                  </div>
                ) : (
                  <div className="cp-classpanel">
                    <div className="cp-classpanelhead">
                      <div>
                        <strong>{activeClass}</strong>
                        <small>
                          {currentCoverage.length} main coverages
                        </small>
                      </div>

                      <button
                        type="button"
                        className={styles.removeClass}
                        onClick={() => removeClass(activeClass)}
                      >
                        Remove class
                      </button>
                    </div>

                    <div className="cp-classpanelbody">
                      <div className={styles.coverageList}>
                        {currentCoverage.length ? (
                          currentCoverage.map((coverage) => (
                            <MainCoverageCard
                              key={JSON.stringify([activeClass, coverage])}
                              className={activeClass}
                              coverage={coverage}
                              expanded={expandedCoverages[activeClass] === coverage}
                              onToggle={() => setExpandedCoverages((current) => ({
                                ...current,
                                [activeClass]: current[activeClass] === coverage ? null : coverage
                              }))}
                              additionalCoverages={selectedCoverage[activeClass][coverage]}
                              onRemove={() => removeCoverage(activeClass, coverage)}
                              onAddAdditional={(additional) => addAdditionalCoverage(activeClass, coverage, additional)}
                              onRemoveAdditional={(additional) => removeAdditionalCoverage(activeClass, coverage, additional)}
                            />
                          ))
                        ) : (
                          <span className="cp-empty">
                            No main coverage selected. Add from library below.
                          </span>
                        )}
                      </div>

                      <div className="cp-addcoverage">
                        <select
                          value={coverageLibraryValue}
                          aria-label={`Coverage library for ${activeClass}`}
                          onChange={(e) =>
                            setCoverageLibraryValue(e.target.value)
                          }
                        >
                          <option value="">
                            Choose main coverage
                          </option>
                          {availableCoverage.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>

                        <button type="button" onClick={addCoverage}>
                          + Add coverage
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="cp-section">
                <div className="cp-sectitle">
                  <div className="cp-num">3</div>
                  <div>
                    <h2>Arrangement</h2>
                    <p>Define carrier participation structure.</p>
                  </div>
                </div>

                <div className="cp-choicegrid">
                  {[
                    {
                      value: "Non-fronting",
                      description:
                        "Carrier retains insurance risk directly.",
                    },
                    {
                      value: "Fronting",
                      description:
                        "Carrier issues policy; risk moves through reinsurance.",
                    },
                  ].map((item) => (
                    <label className="cp-radio" key={item.value}>
                      <input
                        name="arrangement"
                        type="radio"
                        value={item.value}
                        checked={arrangement === item.value}
                        onChange={(e) => setArrangement(e.target.value)}
                      />

                      <span className="cp-choice">
                        <span className="cp-indicator" />
                        <span>
                          <strong>{item.value}</strong>
                          <small>{item.description}</small>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="cp-actions">
                <button
                  type="button"
                  className="cp-btn"
                  onClick={onBack}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="cp-btn"
                  onClick={() => showToast("Draft saved for review.")}
                >
                  Save draft
                </button>

                <button type="submit" className="cp-btn primary">
                  Create product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toast && <div className="cp-toast">{toast}</div>}
    </div>
  );
}
