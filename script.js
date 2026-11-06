const body = document.body;
const openBtn = document.getElementsByClassName("open-btn")[0];
const settings = document.getElementsByClassName("settings")[0];
const imgList = document.getElementsByClassName("img-list")[0].children;
const credits = document.getElementsByClassName("credits")[0];
const logo = document.getElementsByClassName("logo")[0];
const customIndex = imgList.length - 1;
const customLi = imgList[customIndex];
const customBtn = customLi.children[0];
const customImg = customBtn.children[0];
const customClear = customLi.getElementsByClassName("custom-clear")[0];

openBtn.addEventListener("click", (e) => {
	settings.classList.add("opened");
	e.stopPropagation();
});

// Keep the menu open if you click inside of it
body.addEventListener("click", (elem) => {
	if (!isInsideSettingsPage(elem.target)) {
	  	settings.classList.remove("opened");
		return;
	}
});

function isInsideSettingsPage(e) {
    while (e && e !== body && e !== document) {
        if (e.classList && e.classList.contains("settings-wrapper")) {
            return true;
        }
        e = e.parentNode;
    }
    return false;
}

Object.keys(imgList).forEach((key) => {
	let img = imgList[key];
	if (!img || !img.children || img.children.length === 0) return;
	img.addEventListener("click", () => {
		if (img === customLi) {
			handleCustomClick();
			return;
		}
		if (img.children[0].classList.contains("active")) {
			deselectImg(img);
			return;
		}
		activateImage(img);
		setImageAsBackground(img.children[0].children[0].src, key);
		if (img.children[1] !== undefined) {
			setCreditsFromImg(img);
		} else {
    		credits.classList.add("hidden");
		}
	})
})

customClear.addEventListener("click", (e) => {
	e.stopPropagation();
	deselectImg(customLi);
});

function deselectImg(img) {
	img.children[0].classList.remove("active");
	body.style.backgroundImage = "";
	credits.classList.add("hidden");

	browser.storage.sync.set({index: -1});
}

function activateImage(img) {
    let active = Array.from(document.getElementsByClassName("active"));
    active.forEach((el) => el.classList.remove("active"));

    img.children[0].classList.add("active");
}

function setCreditsFromImg(img) {
	credits.classList.remove("hidden");
	credits.children[1].children[0].textContent = img.children[1].textContent;
	credits.children[1].children[1].textContent = img.children[2].textContent;
	credits.children[1].children[0].href = img.children[1].href;
	credits.children[1].children[1].href = img.children[2].href;
}

function setImageAsBackground(image, key) {
	body.style.backgroundImage = `url(${image})`;

	browser.storage.sync.set({
		index: Number(key)
	});
}

function handleCustomClick() {
	if (customBtn.classList.contains("active")) {
		pickCustomImage();
	} else if (customImg.hasAttribute("src")) {
		restoreCustomImage();
	} else {
		pickCustomImage();
	}
}

function restoreCustomImage() {
	activateImage(customLi);
	setImageAsBackground(customImg.src, customIndex);
	credits.classList.add("hidden");
}

function pickCustomImage() {
	let input = document.createElement("input");
	input.accept = "image/*";
	input.type = "file";

	input.onchange = async (e) => {
		let file = e.target.files[0];
		if (!file) return;

		try {
			let image = await compressImage(file);
			customImg.src = image;
			customBtn.classList.add("has-image");
			activateImage(customLi);
			setImageAsBackground(image, customIndex);
			credits.classList.add("hidden");

			browser.storage.local.set({customImage: image})
				.catch((err) => console.error("Failed to save custom image:", err));
		} catch (err) {
			console.error("Failed to load custom image:", err);
		}
	};

	input.click();
}

function compressImage(file) {
	return new Promise((resolve, reject) => {
		let url = URL.createObjectURL(file);
		let image = new Image();

		image.onload = () => {
			let scale = Math.min(1, 2560 / Math.max(image.width, image.height));
			let canvas = document.createElement("canvas");
			canvas.width = Math.round(image.width * scale);
			canvas.height = Math.round(image.height * scale);

			let context = canvas.getContext("2d");
			context.fillStyle = "#1c1b22";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(url);

			resolve(canvas.toDataURL("image/jpeg", 0.85));
		};

		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Unsupported image"));
		};

		image.src = url;
	});
}

async function init() {
	try {
		// Restore an uploaded wallpaper; "image" is the key used before 1.6.
		const local = await browser.storage.local.get(["customImage", "image"]);
		const customImage = local.customImage || local.image;
		if (customImage) {
			customImg.src = customImage;
			customBtn.classList.add("has-image");
		}

		const items = await browser.storage.sync.get(["logo", "index"]);
		if (items.logo) {
			logo.classList.add(`logo-${items.logo}`);
		} else {
			logo.classList.add("logo-firefox");
		}

		if (items.index == -1 || items.index == null) return;

		const entry = imgList[items.index];
		if (!entry || !entry.children[0] || !entry.children[0].children[0].hasAttribute("src")) return;

		body.style.backgroundImage = `url(${entry.children[0].children[0].src})`;

		activateImageInSettingsMenu(items.index);

		const creditLink = entry.children[1];
		if (creditLink && creditLink.tagName === "A") {
			setCredits(items.index);
		}
	} catch (err) {
		console.error("Failed to load settings:", err);
	}
}

init();

function activateImageInSettingsMenu(index) {
	if (index == null) return;
	imgList[index].children[0].classList.add("active");
}

function setCredits(index) {
	if (index == null) return;

	credits.classList.remove("hidden");
	credits.children[1].children[0].textContent = imgList[index].children[1].textContent;
	credits.children[1].children[1].textContent = imgList[index].children[2].textContent;
	credits.children[1].children[0].href = imgList[index].children[1].href;
	credits.children[1].children[1].href = imgList[index].children[2].href;
}

let logos = ["firefox", "nightly", "developer"];

function logoSwitch(name) {
	if (!logos.includes(name)) return;

	logos.forEach(e => {
		logo.classList.remove(`logo-${e}`);
	});
	logo.classList.add(`logo-${name}`);
	browser.storage.sync.set({logo: name});
}
