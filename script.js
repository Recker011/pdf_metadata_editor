// script.js
// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const fileInput = document.getElementById("fileInput");
  const metaContainer = document.getElementById("metadataContainer");
  const displayBody = document.querySelector("#metadataDisplay tbody");
  const form = document.getElementById("metadataForm");
  const dlLink = document.getElementById("downloadLink");
  const saveBtn = document.getElementById("saveButton");

  // Inputs
  const titleIn = document.getElementById("titleInput");
  const authorIn = document.getElementById("authorInput");
  const subjectIn = document.getElementById("subjectInput");
  const keywordsIn = document.getElementById("keywordsInput");
  const creatorIn = document.getElementById("creatorInput");
  const producerIn = document.getElementById("producerInput");
  const creationIn = document.getElementById("creationDateInput");
  const modDateIn = document.getElementById("modDateInput");

  let pdfDoc; // holds loaded PDF

  // 1️⃣ Load PDF and extract metadata
  fileInput.addEventListener("change", async (evt) => {
    const file = evt.target.files[0];
    if (!file) return;

    const bytes = await file.arrayBuffer();
    pdfDoc = await PDFLib.PDFDocument.load(bytes);

    // Gather all standard fields
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

    // Display metadata table
    displayBody.innerHTML = "";
    for (const [key, val] of Object.entries(meta)) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${key}</td><td>${val}</td>`;
      displayBody.appendChild(row);
    }

    // Populate form inputs
    titleIn.value = meta.Title;
    authorIn.value = meta.Author;
    subjectIn.value = meta.Subject;
    keywordsIn.value = meta.Keywords;
    creatorIn.value = meta.Creator;
    producerIn.value = meta.Producer;
    creationIn.value = meta.CreationDate;
    modDateIn.value = meta.ModificationDate;

    // Reveal UI
    metaContainer.hidden = false;
    dlLink.hidden = true;
  });

  // 2️⃣ Save edits & prepare download
  saveBtn.addEventListener("click", async () => {
    if (!pdfDoc) return;

    // Apply edits
    pdfDoc.setTitle(titleIn.value);
    pdfDoc.setAuthor(authorIn.value);
    pdfDoc.setSubject(subjectIn.value);

    const kws = keywordsIn.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    pdfDoc.setKeywords(kws);

    pdfDoc.setCreator(creatorIn.value);
    pdfDoc.setProducer(producerIn.value);

    // Parse ISO dates if provided
    const cd = new Date(creationIn.value);
    if (!isNaN(cd)) pdfDoc.setCreationDate(cd);

    const md = new Date(modDateIn.value);
    if (!isNaN(md)) pdfDoc.setModificationDate(md);

    // Save and blobify
    const updated = await pdfDoc.save();
    const blob = new Blob([updated], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Setup download link
    dlLink.href = url;
    dlLink.download = "pdf-with-updated-metadata.pdf";
    dlLink.textContent = "Download Updated PDF";
    dlLink.hidden = false;
  });
});
