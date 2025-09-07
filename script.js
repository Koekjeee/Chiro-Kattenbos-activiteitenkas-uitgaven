let uitgaven = JSON.parse(localStorage.getItem("uitgaven")) || [];
let nummer = uitgaven.length ? Math.max(...uitgaven.map(u => u.nummer)) + 1 : 1;

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

  uitgaven
    .filter(u => !filter || u.groep === filter)
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
        if (confirm(`Weet je zeker dat je uitgave #${u.nummer} van ${u.groep} wilt verwijderen?`)) {
          verwijderUitgave(u.nummer);
        }
      };
      actieCel.appendChild(knop);
    });
}

function verwijderUitgave(nr) {
  uitgaven = uitgaven.filter(u => u.nummer !== nr);
  localStorage.setItem("uitgaven", JSON.stringify(uitgaven));
  renderTabel(document.getElementById("filterGroep").value);
}

document.getElementById("uitgaveForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const groep = document.getElementById("groep").value;
  const rawBedrag = document.getElementById("bedrag").value.trim();
  const bedrag = parseFloat(rawBedrag.replace(",", "."));
  const activiteit = document.getElementById("activiteit").value;
  const datum = document.getElementById("datum").value;

  if (!groep || isNaN(bedrag) || bedrag <= 0 || !activiteit || !datum) {
    alert("Gelieve alle velden correct in te vullen.");
    return;
  }

  const nieuweUitgave = {
    nummer: nummer++,
    groep,
    bedrag: bedrag.toFixed(2),
    activiteit,
    datum
  };

  uitgaven.push(nieuweUitgave);
  localStorage.setItem("uitgaven", JSON.stringify(uitgaven));
  renderTabel(document.getElementById("filterGroep").value);
  document.getElementById("uitgaveForm").reset();
});

document.getElementById("filterGroep").addEventListener("change", function() {
  renderTabel(this.value);
});

renderTabel();

