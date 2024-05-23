const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const subtitleContent = document.getElementById('subtitle-content');
const speedSelect = document.getElementById('speed-select');

// Sao chép nội dung sang tab 2
tabContents[1].querySelector('.scroll-sub').innerHTML = subtitleContent.innerHTML;
// Sao chép nội dung sang tab 3
tabContents[2].querySelector('.scroll-sub').innerHTML = subtitleContent.innerHTML;
// Sao chép nội dung sang tab 4
tabContents[3].querySelector('.scroll-sub').innerHTML = subtitleContent.innerHTML;

// Ngắt đọc khi chuyển tab
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (isReading) {
            speechSynthesis.cancel();
            isReading = false;
        }
    });
});

const subEnElements = document.querySelectorAll('.sub_en');

subEnElements.forEach(subEn => {
    // Tạo phần tử icon
    const icon = document.createElement('span');
    icon.textContent = '🔊';
    icon.style.marginLeft = '5px';
    icon.classList.add('speaker-icon'); // Thêm class speaker-icon

    // Thêm icon vào sau phần tử subEn
    subEn.appendChild(icon);

    // Thêm sự kiện click cho icon
    icon.addEventListener('click', () => {
        // Lấy nội dung của thẻ span có class sub_en
        const textToSpeak = subEn.textContent;

        // Sử dụng SpeechSynthesis để đọc nội dung
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = parseFloat(speedSelect.value); // Đặt tốc độ đọc
        speechSynthesis.speak(utterance);

        // Thêm class highlight cho dòng hiện tại
        subEn.parentElement.classList.add('highlight');

        // Xóa class highlight và active sau khi đọc xong
        utterance.onend = () => {
            subEn.parentElement.classList.remove('highlight');
        };
    });
});


let currentElementIndex = 0;
let isReading = false; // Biến để theo dõi trạng thái đọc

// Hàm đọc element tiếp theo
function readNextElement(elements, currentElementIndex) {
    if (currentElementIndex < elements.length) {
        const subElement = elements[currentElementIndex];

        // Lấy nội dung của thẻ span
        const textToSpeak = subElement.textContent;

        // Sử dụng SpeechSynthesis để đọc nội dung
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
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
            currentElementIndex++;
            setTimeout(() => {
                readNextElement(elements, currentElementIndex);
            }, 1000); // Chờ 1 giây trước khi đọc element tiếp theo
        };
    } else {
        isReading = false; // Đánh dấu kết thúc đọc
    }
}

// Nút "Anh"
const listenButton = document.getElementById('listen-button');
listenButton.addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-content.active');
    const subEnElements = activeTab.querySelectorAll('.sub_en');

    // Nếu đang đọc thì ngắt đọc
    if (isReading) {
        speechSynthesis.cancel();
        isReading = false;
        return;
    }

    currentElementIndex = 0;
    isReading = true;
    readNextElement(subEnElements, currentElementIndex);
});

// Nút "Việt"
const listenButton1 = document.getElementById('listen-button1');
listenButton1.addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-content.active');
    const subViElements = activeTab.querySelectorAll('.sub_vi');

    // Nếu đang đọc thì ngắt đọc
    if (isReading) {
        speechSynthesis.cancel();
        isReading = false;
        return;
    }

    currentElementIndex = 0;
    isReading = true;
    readNextElement(subViElements, currentElementIndex);
});

// Nút "Song Ngữ"
const listenButton2 = document.getElementById('listen-button2');
listenButton2.addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-content.active');
    // Lấy tất cả các thẻ có class sub_en hoặc sub_vi
    const subElements = activeTab.querySelectorAll('.sub_en, .sub_vi');

    // Nếu đang đọc thì ngắt đọc
    if (isReading) {
        speechSynthesis.cancel();
        isReading = false;
        return;
    }

    currentElementIndex = 0;
    isReading = true;
    readNextElement(subElements, currentElementIndex);
});

// Sự kiện thay đổi tốc độ đọc
speedSelect.addEventListener('change', () => {
    // Nếu đang đọc thì ngắt đọc và bắt đầu lại từ đầu
    if (isReading) {
        speechSynthesis.cancel();
        isReading = false;
        currentElementIndex = 0;
        readNextElement(subEnElements, currentElementIndex); // Hoặc subViElements, subElements
    }
});

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.dataset.target;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        button.classList.add('active');
        document.querySelector(targetId).classList.add('active');
    });
});


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
    const activeTabContent = document.querySelector('.tab-content.active');
    const contentItems = activeTabContent.querySelectorAll('.sub-line');
    contentItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(searchTerm)) {
            item.classList.add('highlight');
        } else {
            item.classList.remove('highlight');
        }
    });
});




let playerInstance;

window.onSpotifyIframeApiReady = IFrameAPI => {
    const playerElement = document.getElementById('hyperplayer');
    const episodeID = extractEpisodeID(playerElement.getAttribute('src'));

    const options = {
      uri: `spotify:episode:${episodeID}`,
    };

    IFrameAPI.createController(playerElement, options, player => {
      player.addListener('playback_update', e => {
        if (!e.data.isPaused) {
          player.seek(e.data.position / 1000);
        }
      });

      player.addListener('ready', () => {
        player.togglePlay();
      });
    });
  };

  function extractEpisodeID(url) {
    const match = url.match(/episode\/(.+)$/);
    return match ? match[1] : null;
  }



function updateTranscriptTime(currentTime) {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (!activeTabContent) return; // Kiểm tra activeTabContent tồn tại

    const subLines = activeTabContent.querySelectorAll('.sub-line');

    subLines.forEach((line) => {
        const startTime = parseFloat(line.getAttribute('data-start'));
        const endTime = parseFloat(line.getAttribute('data-end'));

        if (currentTime >= startTime && currentTime < endTime) {
            line.classList.add('highlight');

            // Scroll đến dòng hiện tại (chỉ khi cần thiết)
            const lineTop = line.offsetTop;
            const activeTabContentTop = activeTabContent.offsetTop;
            const scrollTop = lineTop - activeTabContentTop - 150; // '150' -> 150

            // Sử dụng requestAnimationFrame để cuộn mượt hơn
            requestAnimationFrame(() => {
                activeTabContent.scrollTop = scrollTop;
            });
        } else {
            line.classList.remove('highlight');
        }
    });
}

// Thêm sự kiện click vào từng phần transcript
const subLines = document.querySelectorAll('.sub-line');
subLines.forEach(line => {
    line.addEventListener('click', () => {
        const startTime = parseFloat(line.getAttribute('data-start'));
        playerInstance.seek(startTime);
    });
});