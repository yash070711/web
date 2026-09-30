import Link from 'next/link';
import styles from './ProductOverview.module.css';

function Icon({name}) {
  const paths = {
    coverage: <path d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>,
    classes: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    carrier: <><path d="M6 21V6l6-3 6 3v15H6Z"/><path d="M10 21v-4h4v4M9 8h1m4 0h1M9 11h1m4 0h1"/></>,
    business: <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M8 13l3 3 5-6"/></>,
    arrangement: <><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4H5v4m7-4h7v4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
    questionnaire: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    eligibility: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v4"/></>,
    risk: <><path d="M4 21V11h4v10M10 21V4h4v17M16 21v-7h4v7"/></>,
    distribution: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4m-6 8 6 4"/></>,
    edit: <><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/></>,
    arrow: <path d="m9 6 6 6-6 6"/>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]||paths.coverage}</svg>;
}
const areas = [
  [
    'coverage',
    'Coverage',
    'Configure selected coverages, limits, deductibles and coverage rules.'
  ],
  [
    'questionnaire',
    'Questionnaire',
    'Configure questions for quote and application.'
  ],
  [
    'eligibility',
    'Eligibility',
    'Define eligibility rules using product data and questionnaire answers.'
  ],
  [
    'risk',
    'Risk & Rating',
    'Configure risk classification and rating factors.'
  ],
];
const display = value => value || 'Not set';

function getCoverageGroups(coverages) {
  if (!coverages || typeof coverages !== 'object' || Array.isArray(coverages)) return [];
  return Object.entries(coverages).map(([className, mainCoverages]) => ({
    className,
    coverages: Array.isArray(mainCoverages)
      ? mainCoverages.filter(name => typeof name === 'string').map(name => ({ name, additional: [] }))
      : mainCoverages && typeof mainCoverages === 'object'
        ? Object.entries(mainCoverages).map(([name, additional]) => ({
            name,
            additional: Array.isArray(additional) ? additional.filter(item => typeof item === 'string') : []
          }))
        : []
  }));
}

export default function ProductOverview({product,selectedClasses=[],selectedCoverages=[],children}) {
  const classes = product.selectedClasses || (product.commonClass ? [product.commonClass] : selectedClasses);
  const coverages = product.coverages ?? selectedCoverages;
  const flatCoverages = Array.isArray(coverages) ? coverages.filter(name => typeof name === 'string') : null;
  const coverageGroups = getCoverageGroups(coverages);
  const coverageCount = flatCoverages ? flatCoverages.length : coverageGroups.reduce((total, group) => total + group.coverages.length, 0);
  const showClassNames = classes.length > 1 || coverageGroups.length > 1;
  const summary = [['Product name',product.name],['Product code',product.productId||product.id],['Version',product.version],['Carrier',product.carrier],['Line of business',product.lineOfBusiness],['Arrangement',product.arrangement],['Status',product.status],['Created on',product.createdOn],['Last updated',product.lastUpdated]];
  return <div className={styles.page}>
    <div className={styles.breadcrumb}>Products / <strong>{product.name}</strong></div>
    <header className={styles.heading}>
      <div><h1>{product.name}</h1><div className={styles.tags}><span className={styles.code}>{product.productId||product.id}</span><span className={styles.draft}>{product.status}</span></div><p>{product.description || 'Commercial trucking product configuration and rating setup.'}</p></div>
      <div className={styles.actions}><button type="button" className={styles.button}><Icon name="edit"/>Edit Product</button><button type="button" className={styles.primary}>Validate Product</button></div>
    </header>
    <section className={styles.strip} aria-label="Product highlights">
      {[['carrier','Carrier',product.carrier],['business','Line of Business',product.lineOfBusiness],['arrangement','Arrangement',product.arrangement],['calendar','Created On',product.createdOn]].map(([icon,label,value])=><div key={label} className={styles.highlight}><span className={styles.icon}><Icon name={icon}/></span><div><span className={styles.label}>{label}</span><strong>{display(value)}</strong></div></div>)}
    </section>
    <div className={styles.columns}>
      <section className={styles.card} aria-labelledby="product-summary"><h2 id="product-summary">Product summary</h2>
        <dl className={styles.summary}>{summary.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{label==='Status'?<span className={styles.draft}>{display(value)}</span>:display(value)}</dd></div>)}</dl>
        <div className={styles.selection}><h3>Selected classes <span>{classes.length}</span></h3><ul>{classes.map(name=><li key={name}><Icon name="classes"/><span>{name}</span></li>)}</ul></div>
        <div className={styles.selection}>
          <h3>Selected coverages <span>{coverageCount}</span></h3>
          {flatCoverages ? (
            <ul>{flatCoverages.map(name => <li key={name}><Icon name="coverage"/><span>{name}</span></li>)}</ul>
          ) : coverageGroups.map(group => (
            <div className={styles.coverageGroup} key={group.className}>
              {showClassNames && <h4 className={styles.coverageClass}>{group.className}</h4>}
              <ul className={styles.coverageList}>
                {group.coverages.map(({ name, additional }) => (
                  <li className={styles.mainCoverage} key={name}>
                    <div className={styles.mainCoverageName}><Icon name="coverage"/><strong>{name}</strong></div>
                    {additional.length > 0 && (
                      <ul className={styles.additionalCoverageList}>
                        {additional.map((item, index) => <li className={styles.additionalCoverage} key={item + index}><span aria-hidden="true" className={styles.additionalCoverageIcon}>&bull;</span><span>{item}</span></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.card} aria-labelledby="product-configuration"><h2 id="product-configuration">Product configuration</h2><p className={styles.subtitle}>Configure each area to complete and publish the product.</p>
        <div className={styles.rows}>{areas.map(([icon,title,description])=><div key={title} className={styles.row}><span className={styles.icon}><Icon name={icon}/></span><div className={styles.rowText}><h3>{title}</h3><p>{description}</p></div><span className={styles.status}>{product.configurationStatus?.[icon] || 'Not started'}</span>{title==='Coverage'?<Link href={`/products/${product.id}/coverage`} className={styles.button}>Configure</Link>:<button type="button" className={styles.button} aria-label={'Configure '+title}>Configure</button>}<span className={styles.arrow}><Icon name="arrow"/></span></div>)}</div>
      </section>
    </div>
    {children&&<details className={styles.details}><summary>Existing configuration and rating details</summary><div>{children}</div></details>}
  </div>;
}
