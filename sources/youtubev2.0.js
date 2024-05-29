document.addEventListener('DOMContentLoaded', loadSubtitles);

async function loadSubtitles() {
	const outputHtml = document.getElementById('subtitle-content');
	const jsonUrlElement = document.querySelector('[data-json-url]');
	const jsonUrl = jsonUrlElement.dataset.jsonUrl;

	try {
		const response = await fetch(jsonUrl);
		if (!response.ok) throw new Error('Network response was not ok');
		const jsonData = await response.json();


		// Chuyển đổi dữ liệu và cập nhật data-end trước khi thêm vào HTML
		const updatedJsonData = jsonData.map((item, index, array) => {
			if (index < array.length - 1) {
				const nextItemStartSeconds = timeStringToParts(array[index + 1].start).totalSeconds;
				return {
					...item,
					end: `${nextItemStartSeconds}`
				};
			}
			return item;
		});

		outputHtml.innerHTML = updatedJsonData.map(convertItemToHtml).join('');


		var subLines = document.querySelectorAll('.sub-line');
		subLines.forEach(function(subLine) {
			subLine.addEventListener('click', function() {
				var startTime = parseFloat(this.getAttribute('data-start'));
				player.seekTo(startTime);
			});
		});

		player.addEventListener('onStateChange', function(event) {
			if (event.data == YT.PlayerState.PLAYING) {
				setInterval(highlightCurrentLine, 1);
				setInterval(autoScroll, 3000); // Gọi hàm autoScroll mỗi 0.5 giây
			}
		});

		function highlightCurrentLine() {
			var currentTime = player.getCurrentTime();
			subLines.forEach(function(subLine) {
				var startTime = parseFloat(subLine.getAttribute('data-start'));
				var endTime = parseFloat(subLine.getAttribute('data-end'));

				if (currentTime >= startTime && currentTime < endTime) {
					subLine.classList.add('highlight');
				} else {
					subLine.classList.remove('highlight');
				}
			});
		}

		// Hàm auto scroll
		function autoScroll() {
			var currentTime = player.getCurrentTime();

			var currentLine = Array.from(subLines).find(line => {
				var startTime = parseFloat(line.getAttribute('data-start'));
				var endTime = parseFloat(line.getAttribute('data-end'));
				return currentTime >= startTime && currentTime < endTime;
			});

			if (currentLine) {
				if (autoScrollEnabled) {
					// Tìm container chứa các thẻ div
					var container = currentLine.closest('.tab-content'); // Thay thế '.container' bằng tên class của container

					// Tính toán vị trí scroll để giữ currentLine cách lề trên 150px
					var scrollTop = currentLine.offsetTop - container.offsetTop - 150;

					// Scroll đến vị trí đã tính toán
					container.scrollTop = scrollTop;
				}
			}
		}



	} catch (error) {
		console.error('Lỗi tải file JSON:', error);
		outputHtml.innerHTML = 'Lỗi tải file JSON.';
	}

	// Add event listeners after loading subtitles
	const speakerElements = document.querySelectorAll('.speaker_en, .speaker_vi'); // Select both English and Vietnamese speaker icons
	const speedSelect = document.getElementById('speed-select');

	speakerElements.forEach(speakerElement => {
		const subElement = speakerElement.closest('.sub_en, .sub_vi'); // Find closest sub_en or sub_vi

		speakerElement.addEventListener('click', () => {
			const textToSpeak = subElement.childNodes[0].nodeValue; // Get the text node

			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			utterance.lang = subElement.getAttribute('lang');
			utterance.rate = parseFloat(speedSelect.value);

			speechSynthesis.speak(utterance);

			subElement.parentElement.classList.add('highlight');

			utterance.onend = () => {
				subElement.parentElement.classList.remove('highlight');
			};
		});
	});





	let enState = {
		currentElementIndex: 0,
		isReading: false,
		isPaused: false
	};

	let viState = {
		currentElementIndex: 0,
		isReading: false,
		isPaused: false
	};

	let biState = {
		currentElementIndex: 0,
		isReading: false,
		isPaused: false
	};

	let currentButton = null;

	// Hàm đọc element tiếp theo
	function readNextElement(elements, state) {
		if (state.currentElementIndex < elements.length) {
			const subElement = elements[state.currentElementIndex];

			const textToSpeak = subElement.childNodes[0].nodeValue; // Get the text node

			// Sử dụng SpeechSynthesis để đọc nội dung
			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			utterance.lang = subElement.getAttribute('lang'); // Đặt ngôn ngữ đọc dựa vào thuộc tính lang
			utterance.rate = parseFloat(speedSelect.value); // Đặt tốc độ đọc
			speechSynthesis.speak(utterance);

			// Thêm class highlight cho dòng hiện tại
			subElement.parentElement.classList.add('highlight');
			// Cuộn đến khoảng giữa của dòng đang đọc
			subElement.parentElement.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});

			// Xóa class highlight và active sau khi đọc xong
			utterance.onend = () => {
				subElement.parentElement.classList.remove('highlight');
				state.currentElementIndex++;
				if (state.isReading) {
					setTimeout(() => {
						readNextElement(elements, state);
					}, 1000); // Chờ 1 giây trước khi đọc element tiếp theo
				}
			};
		} else {
			state.isReading = false; // Đánh dấu kết thúc đọc
			if (currentButton) currentButton.textContent = "Nghe"; // Đặt lại nút thành "Nghe"
			currentButton = null;
		}
	}

	// Hàm quản lý trạng thái nút và đọc văn bản
	function handleListenButton(button, elements, state) {
		// Nếu đang đọc và không tạm dừng thì tạm dừng
		if (state.isReading && !state.isPaused && button === currentButton) {
			speechSynthesis.pause();
			state.isPaused = true;
			button.textContent = "Tiếp tục";
			return;
		}

		// Nếu đang đọc và tạm dừng thì tiếp tục đọc
		if (state.isReading && state.isPaused && button === currentButton) {
			speechSynthesis.resume();
			state.isPaused = false;
			button.textContent = "Dừng";
			return;
		}

		// Nếu đang đọc từ nút khác thì hủy tiến trình hiện tại
		if (currentButton && button !== currentButton) {
			speechSynthesis.cancel();
			if (currentButton.state) {
				currentButton.state.isReading = false;
				currentButton.state.isPaused = false;
				currentButton.state.currentElementIndex = 0;
			}
			currentButton.textContent = "Nghe";
		}

		// Bắt đầu đọc mới
		if (!state.isReading) {
			state.currentElementIndex = 0;
			state.isReading = true;
			state.isPaused = false;
			currentButton = button;
			currentButton.state = state; // Lưu trạng thái vào nút
			button.textContent = "Dừng";
			readNextElement(elements, state);
		}
	}

	// Nút "Anh"
	const listenButton = document.getElementById('listen-button');
	listenButton.addEventListener('click', () => {
		const activeTab = document.querySelector('.tab-content');
		const subEnElements = activeTab.querySelectorAll('.sub_en');
		handleListenButton(listenButton, subEnElements, enState);
	});

	// Nút "Việt"
	const listenButton1 = document.getElementById('listen-button1');
	listenButton1.addEventListener('click', () => {
		const activeTab = document.querySelector('.tab-content');
		const subViElements = activeTab.querySelectorAll('.sub_vi');
		handleListenButton(listenButton1, subViElements, viState);
	});

	// Nút "Song Ngữ"
	const listenButton2 = document.getElementById('listen-button2');
	listenButton2.addEventListener('click', () => {
		const activeTab = document.querySelector('.tab-content');
		// Lấy tất cả các thẻ có class sub_en hoặc sub_vi
		const subElements = activeTab.querySelectorAll('.sub_en, .sub_vi');
		handleListenButton(listenButton2, subElements, biState);
	});








	const showTimeSeconds = document.querySelectorAll('.show-time-second');
	const fixedFooter = document.getElementById('fixed-footer');
	const footerContent = document.getElementById('footer-content');
	const playButton = document.getElementById('play-button');
	const recordButton = document.getElementById('record-button');
	const recognitionResult = document.getElementById('recognition-result');

	// Lấy element nút đóng
	const closeButton = document.getElementById('close-button');
	const prevButton = document.getElementById('prev-button');
	const nextButton = document.getElementById('next-button');
	let currentSubEn = null;


	// Hàm để cập nhật nội dung footer dựa trên currentSubLine
	function updateFooterContent() {
		if (currentSubLine) {
			const subEnContent = currentSubLine.querySelector('.sub_en');
			footerContent.textContent = subEnContent.childNodes[0].nodeValue; // Get the text node
			fixedFooter.style.display = 'block';
		}
	}

	// Xử lý sự kiện click vào .show-time-second
	showTimeSeconds.forEach(element => {
		element.addEventListener('click', () => {
			currentSubLine = element.parentElement; // Lấy thẻ div.sub-line cha
			updateFooterContent();
		});
	});

	// Xử lý nút "Tiến"
	nextButton.addEventListener('click', () => {
		if (currentSubLine) {
			const nextSubLine = currentSubLine.nextElementSibling;
			if (nextSubLine) {
				currentSubLine = nextSubLine;
				updateFooterContent();
			}
		}
	});

	// Xử lý nút "Lùi"
	prevButton.addEventListener('click', () => {
		if (currentSubLine) {
			const prevSubLine = currentSubLine.previousElementSibling;
			if (prevSubLine) {
				currentSubLine = prevSubLine;
				updateFooterContent();
			}
		}
	});


	// Khởi tạo SpeechSynthesisUtterance
	let utterance = new SpeechSynthesisUtterance();

	// Xử lý sự kiện click vào nút "Nghe"
	playButton.addEventListener('click', () => {
		if (currentSubLine) {
			const subEnElement = currentSubLine.querySelector('.sub_en');
			const textToSpeak = subEnElement.childNodes[0].nodeValue; // Get the text node
			const language = subEnElement.getAttribute('lang');

			// Cập nhật nội dung và ngôn ngữ cho utterance
			utterance.text = textToSpeak;
			utterance.lang = language;

			// Bắt đầu đọc
			window.speechSynthesis.speak(utterance);
		}
	});


	// Kiểm tra xem trình duyệt có hỗ trợ Speech Recognition hay không
	if ('webkitSpeechRecognition' in window) {
		const recognition = new webkitSpeechRecognition();

		// Xử lý sự kiện click vào nút "Đọc"
		recordButton.addEventListener('click', () => {
			recognition.continuous = false; // Chỉ nhận dạng một lần
			recognition.interimResults = false; // Không trả về kết quả tạm thời

			// Lấy ngôn ngữ từ currentSubLine (hoặc subEnContent nếu cần)
			const language = currentSubLine ? currentSubLine.querySelector('.sub_en').getAttribute('lang') : 'en-US'; // Mặc định là tiếng Anh
			recognition.lang = language;

			recognition.start();




			// Xử lý khi nhận dạng giọng nói thành công (cập nhật)
			recognition.onresult = (event) => {
				const recognizedText = event.results[0][0].transcript;
				const footerText = footerContent.textContent;

				const comparisonResult = compareStrings(footerText, recognizedText);

				recognitionResult.innerHTML = comparisonResult.html;

				// Hiển thị độ chính xác và đánh giá (cập nhật)
				recognitionResult.innerHTML += `<br><span class="accuracy">Chính xác: ${comparisonResult.accuracy}%</span> - <span class="rating">${'★'.repeat(comparisonResult.rating)}${'☆'.repeat(5 - comparisonResult.rating)}</span>`;
			};

			// Xử lý lỗi (nếu có)
			recognition.onerror = (event) => {
				console.error('Lỗi nhận dạng giọng nói:', event.error);
			};
		});
	} else {
		console.error('Trình duyệt không hỗ trợ Speech Recognition!');
		recordButton.disabled = true;
	}

	// Hàm so sánh hai chuỗi và trả về HTML với từ được highlight
	function compareStrings(str1, str2) {
		// Loại bỏ dấu câu trước khi so sánh
		const str1NoPunctuation = str1.replace(/[.,\/#!$%\^&\*\?♪\"\';:{}=\-_`~()]/g, '').toLowerCase();
		const str2NoPunctuation = str2.replace(/[.,\/#!$%\^&\*\?♪\"\';:{}=\-_`~()]/g, '').toLowerCase();

		const words1 = str1NoPunctuation.split(/\s+/);
		const words2 = str2NoPunctuation.split(/\s+/);
		const result = [];
		let correctCount = 0;

		for (let i = 0; i < Math.max(words1.length, words2.length); i++) {
			const word1 = words1[i] || '';
			const word2 = words2[i] || '';

			if (word1 === word2) {
				result.push(`<span class="correct">${word1}</span>`);
				correctCount++;
			} else {
				result.push(`<span class="incorrect">${word2 || ' '}</span>`);
			}
		}

		const accuracy = Math.round((correctCount / words1.length) * 100);
		const rating = Math.round(accuracy / 20); // Đánh giá từ 1-5

		return {
			html: result.join(' '),
			accuracy: accuracy,
			rating: rating
		};
	}

	// Xử lý sự kiện click vào nút đóng
	closeButton.addEventListener('click', () => {
		fixedFooter.style.display = 'none'; // Ẩn container
	});








}

function timeStringToParts(timeString) {
	const [hours, minutes, secondsMilliseconds] = timeString.split(':');
	const [seconds, milliseconds] = secondsMilliseconds.split(',');
	const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
	const totalSeconds = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000).toFixed(2);
	return {
		totalMinutes,
		seconds,
		totalSeconds
	};
}

const lang1Element = document.querySelector('[lang1]');
const lang1 = lang1Element.getAttribute('lang1');

function convertItemToHtml(item) {
	const {
		totalMinutes,
		seconds,
		totalSeconds: startSeconds
	} = timeStringToParts(item.start);
	const startTimeFormatted = `${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

	return `
      <div class="sub-line" data-start="${startSeconds}" data-end="${item.end}">
        <span class="sub_en" lang="${lang1}">${item.en} <span class="speaker_en">▶️</span></span>
		<span class="phien_am" lang="${lang1}">${item.pa}</span>
        <span class="sub_vi" lang="vi">${item.vi} <span class="speaker_vi">▶️</span></span>
        <span class="show-time-second">${startTimeFormatted}</span>
      </div>
    `;
}

const content = document.getElementById('subtitle-content');
const buttons = document.querySelectorAll('.menu button');

buttons.forEach(button => {
	button.addEventListener('click', () => {
		// Xóa class active cho tất cả các nút
		buttons.forEach(b => b.classList.remove('active'));
		// Thêm class active cho nút được click
		button.classList.add('active');
		// Lấy giá trị data-style của nút
		const style = button.dataset.style;
		// Áp dụng style cho nội dung
		content.className = style;
	});
});

// Áp dụng style mặc định cho nội dung
content.className = 'style1'; // Hoặc bất kỳ style nào bạn muốn mặc định



const tabContents = document.querySelectorAll('.tab-content');
const subtitleContent = document.getElementById('subtitle-content');

// Chế độ ngày/đêm
const amButton = document.getElementById('am');
const pmButton = document.getElementById('pm');
const body = document.body;

amButton.addEventListener('click', () => {
	amButton.classList.add('active');
	pmButton.classList.remove('active');
	body.classList.remove('night-mode');
	body.classList.add('day-mode');
});

pmButton.addEventListener('click', () => {
	pmButton.classList.add('active');
	amButton.classList.remove('active');
	body.classList.remove('day-mode');
	body.classList.add('night-mode');
});

// Font size
const fontIncreaseButton = document.getElementById('font-increase');
const fontDecreaseButton = document.getElementById('font-decrease');
let currentFontSize = 16; // Font size mặc định

fontIncreaseButton.addEventListener('click', () => {
	currentFontSize += 1;
	// Áp dụng style cho tất cả tabContent
	tabContents.forEach(tabContent => {
		tabContent.style.fontSize = currentFontSize + 'px';
	});
});

fontDecreaseButton.addEventListener('click', () => {
	if (currentFontSize > 1) {
		currentFontSize -= 1;
		// Áp dụng style cho tất cả tabContent
		tabContents.forEach(tabContent => {
			tabContent.style.fontSize = currentFontSize + 'px';
		});
	}
});

// Độ tương phản
const contrastIncreaseButton = document.getElementById('contrast-increase');
const contrastDecreaseButton = document.getElementById('contrast-decrease');
let currentContrast = 100; // Độ tương phản mặc định (100%)

contrastIncreaseButton.addEventListener('click', () => {
	currentContrast += 5;
	// Áp dụng style cho tất cả tabContent
	tabContents.forEach(tabContent => {
		tabContent.style.filter = `contrast(${currentContrast}%)`;
	});
});

contrastDecreaseButton.addEventListener('click', () => {
	if (currentContrast > 5) {
		currentContrast -= 5;
		// Áp dụng style cho tất cả tabContent
		tabContents.forEach(tabContent => {
			tabContent.style.filter = `contrast(${currentContrast}%)`;
		});
	}
});

// Reset settings
const resetSettingsButton = document.getElementById('reset-settings');

resetSettingsButton.addEventListener('click', () => {
	amButton.classList.add('active');
	pmButton.classList.remove('active');
	body.classList.remove('night-mode');
	body.classList.add('day-mode');

	currentFontSize = 16;
	// Reset style cho tất cả tabContent
	tabContents.forEach(tabContent => {
		tabContent.style.fontSize = currentFontSize + 'px';
		tabContent.style.filter = `contrast(${100}%)`; // Reset contrast
	});

	currentContrast = 100;
});


const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

searchButton.addEventListener('click', () => {
	const searchTerm = searchInput.value.toLowerCase();
	const activeTabContent = document.querySelector('.tab-content');
	const contentItems = activeTabContent.querySelectorAll('.sub-line');
	contentItems.forEach(item => {
		if (item.textContent.toLowerCase().includes(searchTerm)) {
			item.classList.add('highlight');
		} else {
			item.classList.remove('highlight');
		}
	});
});


var player;
var autoScrollEnabled = true;

function onYouTubeIframeAPIReady() {
	let videoID = document.getElementById('myPlayer').dataset.videoid;
	let playerContainer = document.getElementById('myPlayer'); // Lấy container của video

	// Tính toán chiều cao dựa trên tỉ lệ 16/9 và chiều rộng của container
	let containerWidth = playerContainer.offsetWidth;
	let containerHeight = containerWidth * (9 / 16);

	player = new YT.Player('myPlayer', {
		height: containerHeight, // Sử dụng chiều cao đã tính toán
		width: '100%',
		videoId: videoID,
		playerVars: {
			'controls': 1,
			'rel': 0,
			'showinfo': 0
		}
	});

	// Xử lý sự kiện thay đổi trạng thái của checkbox
	autoscrollCheckbox.addEventListener('change', () => {
		autoScrollEnabled = autoscrollCheckbox.checked;
		console.log("Autoscroll enabled:", autoScrollEnabled);
	});
}

</script>