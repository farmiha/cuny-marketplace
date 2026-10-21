// CUNY MarketPlace logo, drawn in code so it follows the campus theme.
// "brand-accent" is the same class the old logo used, so the accent color
// changes with the campus (bag outline, heart and "Market"). The rest stays white.
export default function Logo() {
 return (
   <div className="brand">
     <span
       className="brand-row"
       style={{ display: "inline-flex", alignItems: "center", gap: "0.55em" }}
     >
       {/* shopping bag with a heart */}
       <span className="brand-accent" style={{ display: "inline-flex" }}>
         <svg
           viewBox="0 0 24 28"
           style={{ height: "2.3em", width: "auto" }}
           fill="none"
           stroke="currentColor"
           strokeWidth="1.8"
           strokeLinecap="round"
           strokeLinejoin="round"
         >
           <path d="M8 9V6.5a4 4 0 0 1 8 0V9" />
           <path
             d="M4 9h16l-1 16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"
             fill="#f3efe7"
           />
           <path
             d="M12 21.2s-4.2-2.7-4.2-5.4c0-1.4 1-2.4 2.3-2.4.8 0 1.5.4 1.9 1 .4-.6 1.1-1 1.9-1 1.3 0 2.3 1 2.3 2.4 0 2.7-4.2 5.4-4.2 5.4z"
             fill="currentColor"
             stroke="none"
           />
         </svg>
       </span>


       {/* small spaced "CUNY" on top of "MarketPlace" */}
       <span
         style={{
           display: "inline-flex",
           flexDirection: "column",
           lineHeight: 1,
         }}
       >
         <span
           style={{
             fontSize: "0.5em",
             letterSpacing: "0.45em",
             fontWeight: 400,
             opacity: 0.8,
             marginBottom: "0.2em",
           }}
         >
           CUNY
         </span>
         <span
           style={{
             fontSize: "1.45em",
             fontWeight: 300,
             letterSpacing: "0.01em",
           }}
         >
           <span className="brand-accent">Market</span>Place
         </span>
       </span>
     </span>
   </div>
 );
}
