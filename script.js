// script.js

document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
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

  const creationError = document.getElementById("creationError");
  const modError = document.getElementById("modError");

  const saveBtn = document.getElementById("saveButton");
  const dlLink = document.getElementById("downloadLink");

  let pdfDoc = null;
  let originalName = "";

  // ISO-8601 validator (basic YYYY-MM-DDTHH:MM:SSZ)
  function isValidISO(s) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s);
  }

  // Live validation
  creationIn.addEventListener("input", () => {
    if (creationIn.value && !isValidISO(creationIn.value)) {
      creationIn.classList.add("invalid");
      creationError.style.display = "block";
    } else {
      creationIn.classList.remove("invalid");
      creationError.style.display = "none";
    }
  });
  modDateIn.addEventListener("input", () => {
    if (modDateIn.value && !isValidISO(modDateIn.value)) {
      modDateIn.classList.add("invalid");
      modError.style.display = "block";
    } else {
      modDateIn.classList.remove("invalid");
      modError.style.display = "none";
    }
  });

  // Core file-loading & metadata extraction
  async function loadFile(file) {
    originalName = file.name;

    // Preview original PDF
    const originalURL = URL.createObjectURL(file);
    pdfPreview.src = originalURL;
    previewDiv.hidden = false;

    // Load into pdf-lib
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    // Extract metadata
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

    // Populate table
    displayBody.innerHTML = "";
    for (const [k, v] of Object.entries(meta)) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${k}</td><td>${v}</td>`;
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

    metaContainer.hidden = false;
    dlLink.hidden = true;
  }

  // Wire up file picker
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) loadFile(e.target.files[0]);
  });

  // Drag & Drop events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files[0]?.type === "application/pdf") {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  // Save edits & refresh preview
  saveBtn.addEventListener("click", async () => {
    if (!pdfDoc) return;

    pdfDoc.setTitle(titleIn.value);
    pdfDoc.setAuthor(authorIn.value);
    pdfDoc.setSubject(subjectIn.value);

    const kws = keywordsIn.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    pdfDoc.setKeywords(kws);

    pdfDoc.setCreator(creatorIn.value);
    pdfDoc.setProducer(producerIn.value);

    const cd = new Date(creationIn.value);
    if (!isNaN(cd)) pdfDoc.setCreationDate(cd);
    const md = new Date(modDateIn.value);
    if (!isNaN(md)) pdfDoc.setModificationDate(md);

    const updatedBytes = await pdfDoc.save();
    const blob = new Blob([updatedBytes], { type: "application/pdf" });
    const newURL = URL.createObjectURL(blob);

    // Update preview & download link
    pdfPreview.src = newURL;
    let outName = filenameInput.value.trim() || originalName;
    if (!outName.toLowerCase().endsWith(".pdf")) outName += ".pdf";

    dlLink.href = newURL;
    dlLink.download = outName;
    dlLink.textContent = `Download "${outName}"`;
    dlLink.hidden = false;
  });
});
