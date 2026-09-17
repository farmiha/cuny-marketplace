export default function About() {
  return (
    <div className="page" id="page-about">
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>About CUNY MarketPlace</h2>
          <p className="sub">Built by students, for students, across every CUNY campus.</p>
        </div>
      </div>

      <div className="profile-section" style={{ maxWidth: 720 }}>
        <h3>What this is</h3>
        <p className="profile-sub" style={{ marginBottom: 16 }}>
          CUNY MarketPlace is a student-to-student marketplace for textbooks, dorm gear,
          tickets, tutoring, and anything else students want to buy or sell within their own
          campus community — verified with a CUNY email, so it's always classmates, never
          strangers.
        </p>
        <h3>How it works</h3>
        <p className="profile-sub">
          Sign up with your CUNY login or campus stu-mail address, pick your home campus, and
          you're set — browse what's listed near you, or post something in a couple of minutes.
          Turn on "Shop other CUNY campuses" from your profile any time you want to see listings
          from across the whole university.
        </p>
      </div>
    </div>
  );
}
