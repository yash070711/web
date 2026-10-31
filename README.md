# Product Studio Prototype: Feature Inventory

## Products, versions and releases

Think of it like this. You create a product once, you change it through versions, and publishing turns a version into a release.

| Feature | What it does | Good to know |
|---|---|---|
| Product catalogue | Shows every product with a search box and four counters: Total, Published, Draft and Needs Review. | You get here from the Product Catalogue page. |
| Create product | A short form asks for the carrier, name, description, arrangement and states. | The product ID is made for you. It starts with PRD and counts up. |
| Carrier | You pick from a fixed list of two carriers. | The list lives in the code. |
| Arrangement | Choose Non fronting or Fronting. | Fronting means an MGU does the rating, which is steps 5 to 8. |
| Product states | Tick the US states where the product is sold. All of them are ticked at first. | You need at least one. Coverages can only use these states. |
| Unique name | Two products cannot share a name. | Capital letters do not matter. |
| Edit product | Change the carrier, name, description or arrangement. | Use the edit option on the catalogue row. |
| Delete product | Removes the product and all its versions and releases. | You cannot delete it once it has been given to an organisation. |
| Version list | Open a product row to see its own versions and the copies given to partners. | Copies of fronting products show the MGU's rating status. |
| New version | Copies the latest version into a fresh Draft. | Labels count up, like 2026.01 then 2026.02. Only one draft can be open at a time. |
| Draft saving | Use Save Draft, or just move to another step and it saves for you. | You see an unsaved changes marker, and the page warns you before you leave. |
| Publish | Checks every step, asks you to confirm, then creates a release. | The version becomes read only. Publish is not fully safe yet. If it fails halfway you can end up with a release but a version that is still a draft. |
| Release | A frozen copy of the components, questions, territories, factors and states. | The release number is the product ID followed by the version label. |
| Status badges | Show Draft or Published, plus a rating status for fronting products. | Rating status is Awaiting MGU rating, In progress or Complete. |

## Step 1: Components

A product is made of components. Each component has one line of business, some classes of business, and coverages inside each class.

| Feature | What it does | Good to know |
|---|---|---|
| Component | A named block of the product, shown as a tile. You add and remove them from the tile row. | It needs a name and one line of business. |
| Line of business | Commercial Auto, General Liability, Commercial Property, Workers Compensation or Cyber. | The list is fixed in the code. The product's line of business comes from its components. |
| Class of business | Added as a tab inside a component and picked from the Class of Business library. | Every class needs at least one coverage. |
| Attach coverage | Click a coverage card to add it to a class or take it out. | The cards come from the Coverage library. |
| Mandatory to sell | A checkbox on each attached coverage. | It means the coverage must be on every policy sold. |
| Requires | Buying coverage A also means buying coverage B in the same class. | It works one way only. B can still be sold alone, and a coverage cannot require itself. |
| Safe removal | Removing a coverage, class or component asks you first if work was entered. | It also warns you if the removal breaks a Requires link. |
| Same coverage in many classes | One coverage can sit in several classes. | Each placement is set up on its own in step 2. |

## Step 2: Coverage configuration

You see a coverage tree on the left and the settings of the selected coverage in tabs on the right. The first tab is always Who is protected. The other tabs only show up if the Coverage library switches them on, and each one can be marked Required or Optional there.

| Feature | What it does | Good to know |
|---|---|---|
| Coverage tree | Lists components, classes and coverages, with a search box and a status dot on each coverage. | You can show only the coverages that need attention. A progress bar shows how many are done. |
| Who is protected | First party or Third party. | It is asked first and nothing else can be edited until you answer. Third party removes risk objects. |
| Jurisdiction | Tick the states where the coverage is sold. You can also exclude zip codes. | Only the product's states are shown. Zip codes can be ranges, like 33101 to 33199. At least one state must stay on. |
| Limit | One fixed amount, with quick picks from $100K to $2M. | The underwriter can be allowed to override it between a minimum and a maximum. The limit has to sit inside that range. |
| Deductible | A fixed amount, a percentage of something, or none. | A percentage needs a basis (Insured Value, Coverage Limit, Claim Amount, Declared Value or Shipment Value) and cannot go over 100. |
| Taxable | Yes or No. | Required when the section is switched on. |
| Premium earn behaviour | Pro rata, short rate, minimum earned or fully earned. | It is a dropdown. If the list of choices changes, you pick again. |
| Covered risk object types | Vehicle, Driver, Building, Location, Equipment, Cargo, Person or Cyber asset. | Hidden for third party coverages. |
| Claim behaviour | Loss basis, benefit basis, and how long the insured has to report a claim, in days, weeks or months. | It has an underwriter override switch. Once you start, every field has to be filled. |
| Forms | Attach ACORD forms to the coverage. | It starts from the forms on the library coverage. You can preview a form and leave questions out. |
| Documents required | Pick the documents to ask for and mark each one Not needed, Optional or Required. | 49 US market documents in 7 groups, plus your own. More below. |
| Terms | Free text for conditions, exclusions and waiting periods. | Up to 500 characters. |
| Copy settings | Start a coverage from another coverage's settings. | It copies who is protected, the limit override and every section. |
| Read only mode | Published versions and partner copies cannot be edited. | An MGU can only edit the rating steps. |

### Documents required: detail

| Group | Examples |
|---|---|
| Applications and disclosures | Signed ACORD 125, 126 or 140, supplemental application, no known loss letter, state fraud warning, broker of record letter |
| Prior coverage and loss history | Currently valued loss runs, prior declarations page, proof of prior insurance, CLUE report |
| Business and financial | Financial statements, tax returns, W 9, payroll by class code, subcontractor certificates of insurance, OSHA 300 logs |
| Property | Statement of values, schedule of locations, appraisal, inspection report, roof certification, flood elevation certificate |
| Auto and drivers | Vehicle schedule with VINs, driver list, MVRs, USDOT authority |
| State and federal compliance | TRIA offer, UM and UIM selection or rejection, surplus lines disclosure, diligent effort affidavit, workers comp officer election, hurricane deductible disclosure |
| Billing and binding | ACH authorization, premium finance agreement, down payment, signed binder |

A custom document needs a name. If the whole section is marked Required, at least one document has to be picked. The tab only shows for coverages that have Documents required switched on in the Coverage library.

## Step 3: Questions

Questions are what the person quoting gets asked. A question can belong to the whole product, to one coverage, or to an attached ACORD form.

| Feature | What it does | Good to know |
|---|---|---|
| Product questions | Asked for every coverage in the product. | Saved on the version. |
| Coverage questions | Asked for one coverage only. | Saved on that coverage. You can move them to the product or to another coverage. |
| Answer types | Short text, long text, number, currency, date, Yes or No, multiple choice, checkboxes, dropdown and single checkbox. | Multiple choice, checkboxes and dropdown need at least one option. |
| Question card | Question text, type, help text, options (one per line) and a Required flag. | You can move a question up or down, remove it, and see a live preview. |
| What a question is used for | Tick it for Eligibility, Rating factor, Account level factor, or any mix. | Each step lists only the questions ticked for it. |
| Unticking safely | Unticking a use deletes what was set up under it. | You get asked first, and it tells you how many rules or factors will go. |
| Add a question from a step | The eligibility, rating and account steps can pick an existing question or create a new one. | The box only offers answer types that step can use. |
| Dependent answers | A choice question can say which answers are valid for each answer of another question. | You set it in the form builder. Combination factors use it to filter dropdowns. |
| Form questions | Questions that come from attached ACORD forms. | You can leave some out for a coverage, and their uses are saved for each coverage. |

## Step 4: Eligibility rules

Rules say what should happen when an answer is a certain value.

| Feature | What it does | Good to know |
|---|---|---|
| Question list | Shows the questions ticked for Eligibility, from the product, coverages and forms. | You can search, filter and see how many rules each question has. |
| Rule | When the answer is something, apply an outcome with an optional message. | The choices depend on the answer type. Numbers: less than, at most, greater than, at least, exactly, not, between. Dates: before, after, years ago. Choices: any of, none of. Checkboxes: any, all, none. Text: exactly, contains, blank. |
| Outcomes in the code | Allow with a warning, Refer to Underwriter, Refer to Senior Underwriter and Decline. | They are ranked 1 to 4 so the strictest one wins. |
| Outcome you can use today | Only Refer to Underwriter. | The other three are written but switched off in the code. |
| Rule checks | Rules that are not finished get flagged. | Nothing checks for rules that contradict each other. |
| Publish check | Eligibility problems are checked when you publish. | It applies to fronting products on the carrier side too. |

## Step 5: Rater setup

Every coverage gets one rating method and a rate table. The result is the base rate, which the formula calls `BaseRate`.

| Feature | What it does | Good to know |
|---|---|---|
| Method picker | Value based, Territory based or Single base price. | One method for each coverage. The other blocks are kept but not used. |
| Value based | Looks up the answer to a number or currency question in a table of rate bands. | A band includes its From value and stops just before its To value, so bands never overlap and never leave a gap. |
| Rate type | Each band is either a percent of the value or a flat amount. | Bands are checked for overlaps, and only the last one can have no upper limit. |
| Territory based | A flat rate table over the fields you pick: State, ZIP code, Territory code, or any multiple choice question. | Each row is one combination. A default rate covers anything not listed. |
| Generate rows | Builds every combination of the chosen fields for you. | Capped at 5,000 rows. Tables show 50 rows per page. |
| Territory definitions | A territory is a state plus a set of ZIP codes, defined once per version. | Every coverage in the version shares them. |
| Single base price | One amount for the coverage. | Factors adjust it later. |
| Copy rating | Copy another coverage's rating onto this one. | Offered when other coverages already have a rating. |
| Try it | Type a sample value and see the base rate. | Handy for a quick check. |
| Checks | Needs a valid method, a value question that still exists, and no errors in the tables. | Blocks publishing, except on the carrier side of a fronting product. |

## Step 6: Rating factors

A rating factor is a named number that depends on answers. For example, Radius of operation might give 1.00, 1.15 or 1.35. Factors multiply the base rate in the premium formula.

| Feature | What it does | Good to know |
|---|---|---|
| Coverage picker | You set up factors for one coverage at a time. | A factor belongs to exactly one coverage. It can use that coverage's questions and the product questions. |
| Question list | Shows the questions ticked for Rating factor. | You can add a question from this step with Add question. |
| Choice factor | One value for each answer of a dropdown, multiple choice, Yes or No, or checkbox question. | Answers come from the question's options. |
| Range factor | One value for each range of a number or currency question. | From is included and To is not. The last range can stay open. |
| Name and code | The name is for people. The code is for formulas. | A code starts with a letter and uses only letters, digits and underscores. |
| Reserved codes | BaseRate and AccountFactor cannot be used. | The same code twice on one coverage is an error. |
| Fallback | The value used when no answer or range matches. | A number that is not negative. 1.00 means no change. |
| Value warnings | A warning shows below 0.25 and above 3. | It is a warning, not an error. |
| Effect pills | Show a plus or minus percent, or no change, next to each value. | They update as you type. |
| Sample answer tester | Pick an answer or type a number to see which value comes back. | Works on each factor. |
| Old data repair | Older factors that covered several coverages are split into one each. Ones that used another coverage's questions are dropped. | You are told about it, and nothing saves until you save. |

### Combination factors

This is one factor whose value depends on a mix of answers, for example vehicle type together with radius.

| Feature | What it does | Good to know |
|---|---|---|
| Columns | Each column is a choice, number or currency question ticked for Rating factor. | Number and currency columns keep their own ranges. |
| Table | One row for each combination of answers, with a value. | A combination that is not listed uses the fallback. |
| Dependent dropdowns | A column only offers answers that are valid for the answer in the question it depends on. | You set the dependency in the form builder. If an earlier answer changes, the later cells clear and you are told. |
| Configure All Combinations | Adds a row for every valid combination, with the value left empty. | Skips rows already there and asks before adding more than 2,000. |
| Duplicate and completeness checks | Every cell must be chosen, and the same combination twice is an error. | Values must be 0 or more, and a warning shows outside 0.25 to 3. |
| Range checks | Ranges need a From and a To, cannot overlap, and warn about gaps. | Removing a range clears the rows that used it, after asking. |
| Add question | Add a question from the factor and it becomes a column right away. | Only if it is a type that can be a column. |
| Name, code, fallback | Same rules as single factors. | The code is what you use in the premium formula. |
| Publish check | Errors in any combination factor block publishing. | They count in the Rating factors step status. |

## Step 7: Account level factors

This is one factor for the whole account, for example based on fleet size or years in business. The premium formula sees it as `AccountFactor`.

| Feature | What it does | Good to know |
|---|---|---|
| One per version | A single account level factor holds all the rows. | It is kept between a minimum and a maximum. |
| How it adds up | Each row that applies is added. Plus rows add their value and Minus rows take it away. | It adds, while rating factors multiply. For example 1.00 plus 2.00 minus 1.00 gives 2.00. |
| No row applies | The factor is the neutral 1.00. | It still stays between the limits. |
| Single question factors | One adjustment for each answer or range. | The question must be ticked for Account level factor. |
| Combination factors | One adjustment for each valid combination of answers. | Same dependent dropdowns and Configure All Combinations as rating combinations. |
| Plus or Minus on each row | Every row picks its own direction. | The factor's setting is only the starting choice for new rows. |
| Tester | Pick sample answers to see each row that applies and the total. | It shows the result after the limits are applied. |
| Checks | Min and max, complete rows, and no duplicates. | Blocks publishing, except on the carrier side of a fronting product. |

## Step 8: Premium formula

Each coverage gets one formula that turns the base rate and the factors into a premium, for example `BaseRate * RADIUS * VEHICLE_AGE`.

| Feature | What it does | Good to know |
|---|---|---|
| Formula editor | One expression for each coverage, with a list of the names you can use. | The names are BaseRate, AccountFactor and the codes from the Rating factors step. |
| Allowed syntax | Numbers, plus, minus, times, divide, brackets, commas, factor names and the functions min, max and round. | Anything else is rejected with a plain message. The formula is never run as code. |
| Name checking | Unknown names, missing brackets and wrong function inputs are explained. | Capital letters do not matter. |
| Base rate warning | Warns if the formula does not use BaseRate. | Warning only. |
| Division check | Warns if the formula can divide by zero. | It tests sample values, so it only catches some cases. |
| What a coverage can see | Product factors, its own and its forms' factors, combination factors for it, and the account level factor. | Factors from other coverages are not offered. |
| Status | Each coverage shows Not set, Incomplete or Ready, with counters. | You can filter to only the coverages that need work. |
| Try it | Enter a base rate and sample answers to see the premium. | It shows how each factor was picked: combination, range or fallback. |
| Publish check | Every coverage needs a valid formula. | Skipped on the carrier side of a fronting product. |

## Libraries

These are shared building blocks that products pick from. Each one has its own page in the sidebar.

| Library | Feature | Good to know |
|---|---|---|
| Coverage | Create a coverage from a universal template (17 standard coverages) or from scratch. | The template brings its code and the ACORD forms that go with it. |
| Coverage | Choose which setup sections it uses and mark each one Required or Optional. | There are quick presets: Recommended, All and None. At least one section is needed. |
| Coverage | Attach ACORD forms, customise the fields or edit the form. | Products start from these forms and can adjust them. |
| Coverage | The list shows a badge for each section, with a star on Required ones. You can edit and delete. | Used in step 1 and in the tabs of step 2. |
| Class of Business | Create from a universal class (6 standard classes) or from scratch. | Names must be unique. |
| Class of Business | Search, filter by use, 10 rows per page, and a product count for each class. | A class used by a product cannot be deleted. |
| Acord | A form builder with sections, questions, descriptions and a status. | Layout is stacked or tabs. The same builder opens from coverages. |
| Acord | Question types, options, a Required flag and uses (eligibility, rating, account). | Dependent answers say which answers are valid for another question's answer. |
| Acord | Delete a form. | Not allowed while the form is attached to anything. |
| Acord form versions | Attaching a form pins the coverage to a frozen copy of it. | Editing the form later does not change coverages. They move on only when you update. |
| Acord form versions | A newer version check compares name, description, layout and sections. | A new version is only made if the content really changed. |

## Distribution and MGU rating

A published release is handed to partner organisations on agreed terms. A wizard with three steps does it: Select product, Choose partner and Configure terms.

| Feature | What it does | Good to know |
|---|---|---|
| Select product | Filter products by line of business, status and carrier. | Only published products with a release can be distributed. |
| Choose partner | Filter organisations by type (All, MGU, MGA or Broker), status and search, then pick one or many. | The sample data has 7 organisations. |
| Terms mode | Use the same terms for everyone, or different terms for each organisation on its own tab. | Terms are saved for each organisation. |
| Validity | A from date and a to date. | From starts as today. |
| Policy limit | An amount and a currency (USD, CAD, GBP or EUR). | Starts at 1,000,000 USD. |
| Authority | Binding, Brokerage and Bind Rating. | Picked as chips. |
| Permissions | Can Quote, Can Bind and Can Endorse. | Endorse starts switched off. |
| Claims authority | Yes or No, with a limit and a currency. | Set for each organisation. |
| Gross premium limit | An amount for a period (a year to start with) and a currency. | Starts at 5,000,000. |
| Commission | A type, a basis (Written Premium) and rates for new and renewal business. | Starts at 10% new and 5% renewal. |
| Distributed version | A full copy of the release with new IDs. Its label is the version plus the organisation, and later copies add R2, R3 and so on. | Question and factor references are pointed to the new IDs. |
| Superseding | A new copy for the same organisation marks the earlier active one as Superseded. | Both the version and its distribution record are updated. |
| Saved distributions | A table of what went to whom, with status. | A product cannot be deleted while it is distributed. |
| Carrier view | Partner copies are read only. | The carrier opens them with View. |
| MGU rating | For a fronting product, the MGU opens its copy at step 5 and sets up the rater, factors and formula. | Rating status goes Pending, then In progress, then Complete. |
| MGU access | An MGU only sees the Product Catalogue and Coverage Configuration pages, and only its own versions. | This is only enforced in the browser for now. |
| Complete rating | Checks steps 5 to 8, asks you to confirm, and marks the rating complete. | Editing again moves it back to In progress. |

## Platform

| Area | What it gives you | Good to know |
|---|---|---|
| Server | One small Node file serves the pages and a general JSON API. | No dependencies. Start it with npm start, or npm run dev to restart on changes. |
| API | A path made of api and a collection name, with list, get, create, update and delete. | Update merges with PATCH and replaces with PUT. A new collection is just a new JSON file holding an empty list. |
| Storage | JSON files in the database folder for products, versions, releases, coverages, classes of business, ACORD forms and versions, organisations, distributions and the standard templates. | Every save rewrites the whole file. |
| Role switch | A dropdown in the top bar: Carrier admin, or one of the MGU organisations. | Remembered in the browser. There is no sign in yet. |
| Validation | Every step reports specific problems. Publish lists them all and jumps to the first step that fails. | Problems show in a banner and as dots on tabs. |
| Draft safety | An unsaved changes marker, saving before you change step, and a warning when you leave. | Keeps work from getting lost. |
| Escaping | One shared helper makes text safe before it is shown. | One gap was found in the review: the organisation name in the role switcher. |
| Tests | 82 tests: 34 for account level factors, 44 for combination factors and 4 for documents. | They only cover the calculation code. The server and the screens have none. |
| Not built yet | Sign in, permissions on the server, an all or nothing publish, and protection against two people saving over each other. | These come from the review findings. |
