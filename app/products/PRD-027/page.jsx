import { readProducts } from '../../../src/lib/product-store';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import ProductOverview from '../../../src/components/ProductOverview';

export default async function CommercialAuto() {
  const product = (await readProducts()).find(product => product.id === 'PRD-027');
  if (!product) notFound();
  return <ProductOverview product={product} selectedClasses={['Light, Commercial, Local Truck \u00b7 032','Truckers \u2014 Common Carriers \u00b7 21']} selectedCoverages={['Auto Liability','Auto Physical Damage','Motor Cargo','UM / UIM']}><ExistingConfiguration/></ProductOverview>;
}

function ExistingConfiguration(){return <>

  <div className="breadcrumb">Product Studio / Product Catalogue / Commercial Auto</div>
  <div className="page-header">
    <div><div className="eyebrow">Product Configuration</div><h1>Commercial Auto</h1><p>Commercial trucking product configuration and rating setup.</p></div>
    <div className="tools"><button className="btn">Save Draft</button><button className="btn">Validate</button><button className="btn primary">Publish</button></div>
  </div>
  <div className="studio-nav"><button className="active">Overview</button><button>Product</button><button>Risk</button><button>Coverage</button><button>Rules</button><button>Operations</button></div>
  <section className="metrics">
    <div className="card"><div className="metric-label">Product Status</div><div className="metric-num" style={{"fontSize":"20px"}}>Draft</div><span className="badge draft">Needs validation</span></div>
    <div className="card"><div className="metric-label">Coverages</div><div className="metric-num">7</div><div className="metric-sub">Configured for product</div></div>
    <div className="card"><div className="metric-label">Risk Attributes</div><div className="metric-num">18</div><div className="metric-sub">Mapped to questions</div></div>
    <div className="card"><div className="metric-label">Rating Rules</div><div className="metric-num">32</div><div className="metric-sub">Workbook-derived rules</div></div>
  </section>
  <div className="layout">
    <div>
      <section className="card">
        <div className="card-header"><div><div className="section-label">Product configuration</div><div className="card-title">Commercial Trucking Rating Setup</div><div className="card-subtitle">Core inputs and rating configuration shown in the main workspace.</div></div><button className="btn sm">Edit</button></div>
        <dl className="detail-list">
          <div><dt>Line of Business</dt><dd>Commercial Auto</dd></div>
          <div><dt>Product ID</dt><dd>PRD-027</dd></div>
          <div><dt>Vehicle Type</dt><dd>Trucks, Tractors And Trailers</dd></div>
          <div><dt>Primary Class</dt><dd>Light, Commercial, Local Truck · 032</dd></div>
          <div><dt>Secondary Class</dt><dd>Truckers — Common Carriers · 21</dd></div>
          <div><dt>Rating Territory</dt><dd>Resolved from ZIP</dd></div>
          <div><dt>Rating Method</dt><dd>Workbook rating engine</dd></div>
          <div><dt>Effective Date</dt><dd>2026 configuration</dd></div>
        </dl>
      </section>
      <section className="card" style={{"marginTop":"16px"}}>
        <div className="card-header"><div><div className="section-label">Coverage</div><div className="card-title">Configured Coverages</div></div><button className="btn sm">Configure Coverage</button></div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Coverage</th><th>Limit / Basis</th><th>Deductible</th><th>Status</th><th>Rating source</th></tr></thead><tbody>
          <tr><td><strong>Auto Liability</strong></td><td>$100,000</td><td>$1,000</td><td><span className="badge live">Configured</span></td><td>CA_Liab_LC + factors</td></tr>
          <tr><td><strong>Auto Physical Damage</strong></td><td>$100,000 TIV</td><td>$1,000</td><td><span className="badge live">Configured</span></td><td>PhysDamRatesByTIV</td></tr>
          <tr><td>Motor Cargo</td><td>$120,000</td><td>—</td><td><span className="badge info">Input only</span></td><td>No dedicated workbook table located</td></tr>
          <tr><td>UM / UIM</td><td>Configured</td><td>—</td><td><span className="badge live">Configured</span></td><td>CommonCoverages</td></tr>
        </tbody></table></div>
      </section>
    </div>
    <aside>
      <section className="card"><div className="section-label">Rating engine</div><div className="card-title">Rating Trace</div><div className="card-subtitle" style={{"marginBottom":"12px"}}>Example quote context</div>
        <dl style={{"fontSize":"10px","display":"grid","gap":"10px"}}><div><dt style={{"color":"#738096"}}>State / Territory</dt><dd style={{"margin":"2px 0 0"}}>CA / 111</dd></div><div><dt style={{"color":"#738096"}}>NAICS</dt><dd style={{"margin":"2px 0 0"}}>484110</dd></div><div><dt style={{"color":"#738096"}}>Annual Mileage</dt><dd style={{"margin":"2px 0 0"}}>5,000</dd></div><div><dt style={{"color":"#738096"}}>Liability Loss Cost</dt><dd style={{"margin":"2px 0 0"}}><strong>$808</strong></dd></div><div><dt style={{"color":"#738096"}}>Liability LCM</dt><dd style={{"margin":"2px 0 0"}}>1.67</dd></div><div><dt style={{"color":"#738096"}}>Program Deductible Adj.</dt><dd style={{"margin":"2px 0 0"}}>0.75</dd></div></dl>
        <div className="notice">Rating values shown here are workbook-derived configuration references. Final premium requires all dependent factors and workbook/VBA dependencies to be resolved.</div>
      </section>
      <section className="card" style={{"marginTop":"16px"}}><div className="section-label">Recent activity</div><div className="activity"><div className="activity-row"><span className="dot"></span>Coverage configuration updated<br/><span style={{"color":"#8997a8"}}>Today · 10:22</span></div><div className="activity-row"><span className="dot"></span>Rating rule validation requested<br/><span style={{"color":"#8997a8"}}>Today · 09:48</span></div><div className="activity-row"><span className="dot"></span>Product version created<br/><span style={{"color":"#8997a8"}}>Yesterday</span></div></div></section>
    </aside>
  </div>
  <div className="footer"><span>VeriDex Product Studio · Commercial Auto</span><span>Configuration workspace</span></div>

</>;}
