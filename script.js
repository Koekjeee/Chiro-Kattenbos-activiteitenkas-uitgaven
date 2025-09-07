let nummer = 1;

document.getElementById("uitgaveForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const groep = document.getElementById("groep").value;
  const bedrag = document.getElementById("bedrag").value;
  const activiteit = document.getElementById("activiteit").value;
  const datum = document.getElementById("datum").value;

  if (!groep || !bedrag || !activiteit || !datum) {
    alert("Gelieve alle velden in te vullen.");
    return;
  }

  const tabel = document.querySelector("#overzicht tbody");
  const rij = tabel.insertRow();
  rij.insertCell(0).textContent = nummer++;
  rij.insertCell(1).textContent = groep;
  rij.insertCell(2).textContent = `€${bedrag}`;
  rij.insertCell(3).textContent = activiteit;
  rij.insertCell(4).textContent = datum;

  document.getElementById("uitgaveForm").reset();
});