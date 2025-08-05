// script.js

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const previewDiv = document.getElementById("previewContainer");
  const pdfPreview = document.getElementById("pdfPreview");
  const metaContainer = document.getElementById("metadataContainer");
  const displayBody = document.querySelector("#metadataDisplay tbody");
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

  let pdfDoc = null;
  let originalName = "";

  // When a file is selected...
  fileInput.addEventListener("change", async (evt) => {
    const file = evt.target.files[0];
    if (!file) return;

    originalName = file.name;

    // 1️⃣ Show preview of the original PDF
    const fileURL = URL.createObjectURL(file);
    pdfPreview.src = fileURL;
    previewDiv.hidden = false;

    // 2️⃣ Load into pdf-lib for metadata extraction
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    // Build metadata object
    const meta = {
      Title: pdfDoc.getTitle() || "",
      Author: pdfDoc.getAuthor() || "",
      Subject: pdfDoc.getSubject() || "",
      Keywords: (pdfDoc.getKeywords() || []).join(", "),
      Creator: pdfDoc.getCreator() || "",
      Producer: pdfDoc.getProducer() || "",
      CreationDate: pdfDoc.getCreationDate()?.toISOString() || "",
      ModificationDate: pdfDoc.getModificationDate()?.toISOString() || "",
    };

    // Populate metadata table
    displayBody.innerHTML = "";
    for (const [key, value] of Object.entries(meta)) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${key}</td><td>${value}</td>`;
      displayBody.appendChild(row);
    }

    // Populate form
    filenameInput.value = originalName;
    titleIn.value = meta.Title;
    authorIn.value = meta.Author;
    subjectIn.value = meta.Subject;
    keywordsIn.value = meta.Keywords;
    creatorIn.value = meta.Creator;
    producerIn.value = meta.Producer;
    creationIn.value = meta.CreationDate;
    modDateIn.value = meta.ModificationDate;

    // Reveal metadata form & hide old download link
    metaContainer.hidden = false;
    dlLink.hidden = true;
  });

  // When the user clicks Save & Download...
  saveBtn.addEventListener("click", async () => {
    if (!pdfDoc) return;

    // Update metadata
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

    const cd = new Date(creationIn.value);
    if (!isNaN(cd)) pdfDoc.setCreationDate(cd);
    const md = new Date(modDateIn.value);
    if (!isNaN(md)) pdfDoc.setModificationDate(md);

    // Serialize & make blob URL
    const updatedBytes = await pdfDoc.save();
    const blob = new Blob([updatedBytes], { type: "application/pdf" });
    const newURL = URL.createObjectURL(blob);

    // Update preview to show edited PDF
    pdfPreview.src = newURL;

    // Configure download link
    let outName = filenameInput.value.trim() || originalName;
    if (!outName.toLowerCase().endsWith(".pdf")) outName += ".pdf";
    dlLink.href = newURL;
    dlLink.download = outName;
    dlLink.textContent = `Download "${outName}"`;
    dlLink.hidden = false;
  });
});
