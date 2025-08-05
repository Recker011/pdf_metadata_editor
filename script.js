// script.js

document.addEventListener("DOMContentLoaded", () => {
  // === Theme toggle logic ===
  const themeToggle = document.getElementById("themeToggle");
  // applyTheme: sets the `dark` class, saves preference, updates button text
  const applyTheme = (theme) => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pdfMetaTheme", theme);
    // Update label: when dark, offer "Light Mode", else "Dark Mode"
    themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  };
  // Determine initial theme (saved or system)
  const savedTheme = localStorage.getItem("pdfMetaTheme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);
  // Toggle on button click
  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
  });

  // === PDF metadata logic ===
  const fileInput = document.getElementById("fileInput");
  const metaContainer = document.getElementById("metadataContainer");
  const displayBody = document.querySelector("#metadataDisplay tbody");
  const filenameIn = document.getElementById("filenameInput");
  const titleIn = document.getElementById("titleInput");
  const authorIn = document.getElementById("authorInput");
  const subjectIn = document.getElementById("subjectInput");
  const keywordsIn = document.getElementById("keywordsInput");
  const creatorIn = document.getElementById("creatorInput");
  const producerIn = document.getElementById("producerInput");
  const creationIn = document.getElementById("creationDateInput");
  const modDateIn = document.getElementById("modDateInput");
  const saveBtn = document.getElementById("saveButton");
  const dlLink = document.getElementById("downloadLink");

  let pdfDoc = null,
    originalName = "";

  // 1️⃣ Load PDF & extract metadata
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    originalName = file.name;

    const bytes = await file.arrayBuffer();
    pdfDoc = await PDFLib.PDFDocument.load(bytes);

    // Build metadata object
    const meta = {
      Title: pdfDoc.getTitle() || "",
      Author: pdfDoc.getAuthor() || "",
      Subject: pdfDoc.getSubject() || "",
      Keywords: (pdfDoc.getKeywords() || []).join(", "),
      Creator: pdfDoc.getCreator() || "",
      Producer: pdfDoc.getProducer() || "",
      CreationDate: pdfDoc.getCreationDate()
        ? pdfDoc.getCreationDate().toISOString()
        : "",
      ModificationDate: pdfDoc.getModificationDate()
        ? pdfDoc.getModificationDate().toISOString()
        : "",
    };

    // Populate metadata table
    displayBody.innerHTML = "";
    Object.entries(meta).forEach(([k, v]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${k}</td><td>${v}</td>`;
      displayBody.appendChild(row);
    });

    // Prefill form inputs
    filenameIn.value = originalName;
    titleIn.value = meta.Title;
    authorIn.value = meta.Author;
    subjectIn.value = meta.Subject;
    keywordsIn.value = meta.Keywords;
    creatorIn.value = meta.Creator;
    producerIn.value = meta.Producer;
    creationIn.value = meta.CreationDate;
    modDateIn.value = meta.ModificationDate;

    metaContainer.hidden = false;
    dlLink.hidden = true;
  });

  // 2️⃣ Save edits & prepare download
  saveBtn.addEventListener("click", async () => {
    if (!pdfDoc) return;
    pdfDoc.setTitle(titleIn.value);
    pdfDoc.setAuthor(authorIn.value);
    pdfDoc.setSubject(subjectIn.value);
    pdfDoc.setKeywords(
      keywordsIn.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    pdfDoc.setCreator(creatorIn.value);
    pdfDoc.setProducer(producerIn.value);

    const cd = new Date(creationIn.value);
    if (!isNaN(cd)) pdfDoc.setCreationDate(cd);
    const md = new Date(modDateIn.value);
    if (!isNaN(md)) pdfDoc.setModificationDate(md);

    const updated = await pdfDoc.save();
    const blob = new Blob([updated], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Determine output filename
    let outName = filenameIn.value.trim() || originalName;
    if (!outName.toLowerCase().endsWith(".pdf")) outName += ".pdf";

    // Configure download link
    dlLink.href = url;
    dlLink.download = outName;
    dlLink.textContent = `Download "${outName}"`;
    dlLink.hidden = false;
  });
});
