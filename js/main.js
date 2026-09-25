function initContactForm() {
  const contactForm = document.querySelector(".contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks for your message! Hook this form up to a backend or service when you're ready.");
    contactForm.reset();
  });
}

function normalizePhoto(entry) {
  if (typeof entry === "string") {
    return { file: entry, caption: "" };
  }
  return {
    file: entry.file,
    caption: typeof entry.caption === "string" ? entry.caption : "",
  };
}

async function loadSfPhotos() {
  const response = await fetch("images/sf-photos.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load photo list (${response.status})`);
  }

  const data = await response.json();
  const rawPhotos = Array.isArray(data) ? data : data.photos;
  const directory = Array.isArray(data) ? "images/sf png" : data.directory || "images/sf png";

  if (!Array.isArray(rawPhotos) || rawPhotos.length === 0) {
    throw new Error("Photo list is empty");
  }

  const photos = rawPhotos.map(normalizePhoto).filter((photo) => photo.file);
  if (!photos.length) {
    throw new Error("Photo list is empty");
  }

  return {
    photos,
    dirPrefix: directory.replace(/\/?$/, "/"),
  };
}

function photoUrl(dirPrefix, file) {
  return (
    dirPrefix
      .split("/")
      .map((part) => (part ? encodeURIComponent(part) : ""))
      .join("/") + encodeURIComponent(file)
  );
}

function mountSlideshow(root, photos, dirPrefix) {
  const AUTO_MS = 5000;
  const MANUAL_PAUSE_MS = 15000;

  const track = root.querySelector(".slideshow-track");
  const counter = root.querySelector(".slideshow-counter");
  const photoCaption = root.querySelector(".slideshow-photo-caption");
  const prevBtn = root.querySelector(".slideshow-nav--prev");
  const nextBtn = root.querySelector(".slideshow-nav--next");
  const frame = root.querySelector(".slideshow-frame");

  const slides = photos.map((photo, index) => {
    const slide = document.createElement("div");
    slide.className = "slideshow-slide";
    slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

    const img = document.createElement("img");
    img.src = photoUrl(dirPrefix, photo.file);
    img.alt = photo.caption.trim()
      ? photo.caption.trim()
      : `San Francisco trip photo ${index + 1} of ${photos.length}`;
    img.loading = index === 0 ? "eager" : "lazy";
    img.decoding = "async";

    slide.appendChild(img);
    track.appendChild(slide);
    return slide;
  });

  let index = 0;
  let hovering = false;
  let resumeAt = 0;
  let timerId = null;

  function updateCaption(i) {
    if (counter) {
      counter.textContent = ` · ${i + 1} / ${slides.length}`;
    }
    if (!photoCaption) return;

    const text = photos[i].caption.trim();
    photoCaption.textContent = text;
    photoCaption.hidden = !text;
  }

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });
    updateCaption(index);
  }

  function schedule() {
    clearTimeout(timerId);
    timerId = setTimeout(tick, AUTO_MS);
  }

  function tick() {
    if (!hovering && Date.now() >= resumeAt) {
      show(index + 1);
    }
    schedule();
  }

  function go(delta) {
    show(index + delta);
    resumeAt = Date.now() + MANUAL_PAUSE_MS;
    schedule();
  }

  prevBtn?.addEventListener("click", () => go(-1));
  nextBtn?.addEventListener("click", () => go(1));

  frame?.addEventListener("mouseenter", () => {
    hovering = true;
  });
  frame?.addEventListener("mouseleave", () => {
    hovering = false;
    schedule();
  });
  frame?.addEventListener("focusin", () => {
    hovering = true;
  });
  frame?.addEventListener("focusout", (e) => {
    if (!frame.contains(e.relatedTarget)) {
      hovering = false;
      schedule();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(timerId);
    } else {
      schedule();
    }
  });

  show(0);
  schedule();
}

async function initSlideshow() {
  const root = document.querySelector(".slideshow");
  if (!root) return;

  try {
    const { photos, dirPrefix } = await loadSfPhotos();
    mountSlideshow(root, photos, dirPrefix);
  } catch (err) {
    console.error("Could not start slideshow:", err);
    const caption = root.querySelector(".slideshow-caption");
    if (caption) {
      caption.textContent = "Photo slideshow unavailable — try regenerating images/sf-photos.json.";
    }
  }
}

function initApp() {
  initContactForm();
  initSlideshow();
}

document.addEventListener("includes:loaded", initApp);
