const correctWachtwoord = "chiro2025";

function controleerWachtwoord() {
  const invoer = document.getElementById("wachtwoord").value;
  if (invoer === correctWachtwoord) {
    document.getElementById("loginScherm").style.display = "none";
    document.getElementById("appInhoud").style.display = "block";
    renderTabel();
  } else {
    document.getElementById("loginFout").textContent = "Wachtwoord is onjuist.";
  }
}

const groepKleuren = {
  Ribbels: "#cce5ff",
  Speelclubs: "#ffe5cc",
  Rakkers: "#e5ffcc",
  Kwiks: "#ffccf2",
  Tippers: "#d5ccff",
  Toppers: "#ccffd5",
  Aspi: "#ffd5cc",
  LEIDING: "#dddddd"
};

function renderTabel(filter = "") {
  const tbody = document.querySelector("#overzicht tbody");
  tbody.innerHTML = "";

  firebase.database().ref("uitgaven").once("value", snapshot => {
    const data = snapshot.val();
    const uitgaven = data ? Object.values(data) : [];

    uitgaven
      .filter(u => !filter || u.groep === filter)
      .sort((a, b) => b.nummer - a.nummer)
      .forEach(u => {
        const rij = tbody.insertRow();
        rij.style.backgroundColor = groepKleuren[u.groep] || "#fff";
        rij.insertCell(0).textContent = u.nummer;
        rij.insertCell(1).textContent = u.groep;
        rij.insertCell(2).textContent = `€${u.bedrag}`;
        rij.insertCell(3).textContent = u.activiteit;
        rij.insertCell(4).textContent = u.datum;

        const actieCel = rij.insertCell(5);
        const knop = document.createElement("button");
        knop.textContent = "Verwijder";
        knop.className = "verwijder";
        knop.onclick = () => {
          if (confirm(`Weet je zeker dat je uitgave wilt verwijderen?`)) {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(document.getElementById("filterGroep").value);
          }
        };
        actieCel.appendChild(knop);
      });
  });
}

document.getElementById("uitgaveForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const groep = document.getElementById("groep").value.trim();
  const rawBedrag = document.getElementById("bedrag").value.trim().replace(",", ".");
  const bedrag
