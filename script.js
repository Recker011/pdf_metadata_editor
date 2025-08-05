// script.js

// Wait for DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // === DOM references ===
  const fileInput = document.getElementById("fileInput");
  const metaContainer = document.getElementById("metadataContainer");
  const displayBody = document.querySelector("#metadataDisplay tbody");
  const form = document.getElementById("metadataForm");
  const filenameInput = document.getElementById("filenameInput");
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

  let pdfDoc = null; // Will hold the loaded PDFDocument
  let originalName = ""; // To remember uploaded filename

  // --- 1️⃣ Load PDF & extract metadata ---
  fileInput.addEventListener("change", async (evt) => {
    const file = evt.target.files[0];
    if (!file) return;

    // Remember original filename
    originalName = file.name;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    // Load into pdf-lib
    pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    // Build metadata object with all standard fields
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
    for (const [key, value] of Object.entries(meta)) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${key}</td><td>${value}</td>`;
      displayBody.appendChild(row);
    }

    // Populate form inputs
    filenameInput.value = originalName;
    titleIn.value = meta.Title;
    authorIn.value = meta.Author;
    subjectIn.value = meta.Subject;
    keywordsIn.value = meta.Keywords;
    creatorIn.value = meta.Creator;
    producerIn.value = meta.Producer;
    creationIn.value = meta.CreationDate;
    modDateIn.value = meta.ModificationDate;

    // Show the metadata UI
    metaContainer.hidden = false;
    dlLink.hidden = true;
  });

  // --- 2️⃣ Save edits & prepare download ---
  saveBtn.addEventListener("click", async () => {
    if (!pdfDoc) return;

    // Update all metadata fields from form
    pdfDoc.setTitle(titleIn.value);
    pdfDoc.setAuthor(authorIn.value);
    pdfDoc.setSubject(subjectIn.value);

    const kwArray = keywordsIn.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    pdfDoc.setKeywords(kwArray);

    pdfDoc.setCreator(creatorIn.value);
    pdfDoc.setProducer(producerIn.value);

    // Parse and set creation/mod dates if valid
    const cd = new Date(creationIn.value);
    if (!isNaN(cd)) pdfDoc.setCreationDate(cd);

    const md = new Date(modDateIn.value);
    if (!isNaN(md)) pdfDoc.setModificationDate(md);

    // Serialize PDF to bytes
    const updatedBytes = await pdfDoc.save();
    // Create a Blob & object URL
    const blob = new Blob([updatedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Determine download filename
    let outName = filenameInput.value.trim() || originalName;
    if (!outName.toLowerCase().endsWith(".pdf")) {
      outName += ".pdf";
    }

    // Configure and show download link
    dlLink.href = url;
    dlLink.download = outName;
    dlLink.textContent = `Download "${outName}"`;
    dlLink.hidden = false;
  });
});
