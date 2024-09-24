let currentAlbum = 'default';
let albums = ['default'];
let selectedPhotos = [];

// DOM Elements
const photoContainer = document.getElementById('photo-container');
const fileUpload = document.getElementById('file-upload');
const uploadButton = document.getElementById('upload-button');
const dragDropArea = document.getElementById('drag-drop-area');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const albumList = document.getElementById('album-list');
const createAlbumButton = document.getElementById('create-album-button');
const moveToAlbumButton = document.getElementById('move-to-album');
const deletePhotoButton = document.getElementById('delete-photo');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const selectAllButton = document.getElementById('select-all');
const moveSelectedButton = document.getElementById('move-selected');
const deleteSelectedButton = document.getElementById('delete-selected');
const editPhotoButton = document.getElementById('edit-photo');
const sharePhotoButton = document.getElementById('share-photo');
const editor = document.getElementById('editor');
const editorImage = document.getElementById('editor-image');
const cropButton = document.getElementById('crop-button');
const rotateLeftButton = document.getElementById('rotate-left');
const rotateRightButton = document.getElementById('rotate-right');
const applyFilterButton = document.getElementById('apply-filter');
const saveEditButton = document.getElementById('save-edit');
const cancelEditButton = document.getElementById('cancel-edit');
const shareModal = document.getElementById('share-modal');
const shareLink = document.getElementById('share-link');
const copyLinkButton = document.getElementById('copy-link');
const closeShareModalButton = document.getElementById('close-share-modal');
const tagInput = document.getElementById('tag-input');
const addTagButton = document.getElementById('add-tag');
const tagsList = document.getElementById('tags-list');

// Event Listeners
uploadButton.addEventListener('click', () => fileUpload.click());
fileUpload.addEventListener('change', handleFileSelect);
dragDropArea.addEventListener('dragover', handleDragOver);
dragDropArea.addEventListener('dragleave', handleDragLeave);
dragDropArea.addEventListener('drop', handleDrop);
lightbox.querySelector('.close').addEventListener('click', closeLightbox);
createAlbumButton.addEventListener('click', createAlbum);
moveToAlbumButton.addEventListener('click', movePhotoToAlbum);
deletePhotoButton.addEventListener('click', deletePhoto);
searchButton.addEventListener('click', searchPhotos);
selectAllButton.addEventListener('click', selectAllPhotos);
moveSelectedButton.addEventListener('click', moveSelectedPhotos);
deleteSelectedButton.addEventListener('click', deleteSelectedPhotos);
editPhotoButton.addEventListener('click', openEditor);
sharePhotoButton.addEventListener('click', sharePhoto);
cropButton.addEventListener('click', cropImage);
rotateLeftButton.addEventListener('click', () => rotateImage(-90));
rotateRightButton.addEventListener('click', () => rotateImage(90));
applyFilterButton.addEventListener('click', applyFilter);
saveEditButton.addEventListener('click', saveEdit);
cancelEditButton.addEventListener('click', cancelEdit);
copyLinkButton.addEventListener('click', copyShareLink);
closeShareModalButton.addEventListener('click', closeShareModal);
addTagButton.addEventListener('click', addTag);

// Initialize
loadAlbums();
loadPhotos();

function loadAlbums() {
    albums = JSON.parse(localStorage.getItem('albums')) || ['default'];
    albumList.innerHTML = '';
    albums.forEach(album => {
        const albumElement = createAlbumElement(album);
        albumList.appendChild(albumElement);
    });
}

function createAlbumElement(albumName) {
    const div = document.createElement('div');
    div.className = 'album';
    const photos = JSON.parse(localStorage.getItem(`${albumName}_photos`)) || [];
    const coverPhoto = photos.length > 0 ? photos[0].data : 'placeholder.jpg';
    div.innerHTML = `
        <img src="${coverPhoto}" alt="${albumName} cover" class="album-cover">
        <p>${albumName}</p>
        <span class="album-photo-count">${photos.length}</span>
    `;
    div.addEventListener('click', () => selectAlbum(albumName));
    return div;
}

function selectAlbum(albumName) {
    currentAlbum = albumName;
    document.querySelectorAll('.album').forEach(album => album.classList.remove('active'));
    document.querySelector(`.album:nth-child(${albums.indexOf(albumName) + 1})`).classList.add('active');
    loadPhotos();
}

function createAlbum() {
    const albumName = prompt('Enter a name for the new album:');
    if (albumName && !albums.includes(albumName)) {
        albums.push(albumName);
        localStorage.setItem('albums', JSON.stringify(albums));
        loadAlbums();
        selectAlbum(albumName);
    }
}

function loadPhotos() {
    const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
    photoContainer.innerHTML = '';
    photos.forEach(photo => {
        const photoElement = createPhotoElement(photo);
        photoContainer.appendChild(photoElement);
    });
    initializeSortable();
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    dragDropArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    dragDropArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    dragDropArea.classList.remove('dragover');
    const files = event.dataTransfer.files;
    handleFiles(files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const photoData = event.target.result;
            const caption = prompt('Enter a caption for this photo:');
            savePhoto(photoData, caption);
        };
        reader.readAsDataURL(file);
    });
}

function savePhoto(photoData, caption) {
    const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
    photos.push({ data: photoData, caption: caption, tags: [] });
    localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(photos));
    loadPhotos();
}

function createPhotoElement(photo) {
    const div = document.createElement('div');
    div.className = 'photo-item';
    div.innerHTML = `
        <input type="checkbox" class="checkbox">
        <img src="${photo.data}" alt="${photo.caption}">
        <p>${photo.caption}</p>
    `;
    div.querySelector('img').addEventListener('click', () => openLightbox(photo));
    div.querySelector('.checkbox').addEventListener('change', (e) => togglePhotoSelection(e, photo));
    return div;
}

function openLightbox(photo) {
    lightboxImg.src = photo.data;
    lightboxImg.alt = photo.caption;
    lightboxCaption.textContent = photo.caption;
    lightbox.classList.add('visible');
    moveToAlbumButton.onclick = () => movePhotoToAlbum(photo);
    deletePhotoButton.onclick = () => deletePhoto(photo);
    editPhotoButton.onclick = () => openEditor(photo);
    sharePhotoButton.onclick = () => sharePhoto(photo);
    loadTags(photo);
}

function closeLightbox() {
    lightbox.classList.remove('visible');
}

function movePhotoToAlbum(photo) {
    const targetAlbum = prompt('Enter the name of the album to move this photo to:');
    if (targetAlbum && albums.includes(targetAlbum)) {
        const currentPhotos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
        const targetPhotos = JSON.parse(localStorage.getItem(`${targetAlbum}_photos`)) || [];
        
        const photoIndex = currentPhotos.findIndex(p => p.data === photo.data && p.caption === photo.caption);
        if (photoIndex !== -1) {
            const [movedPhoto] = currentPhotos.splice(photoIndex, 1);
            targetPhotos.push(movedPhoto);
            
            localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(currentPhotos));
            localStorage.setItem(`${targetAlbum}_photos`, JSON.stringify(targetPhotos));
            
            loadPhotos();
            closeLightbox();
        }
    }
}

function deletePhoto(photo) {
    if (confirm('Are you sure you want to delete this photo?')) {
        const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
        const photoIndex = photos.findIndex(p => p.data === photo.data && p.caption === photo.caption);
        if (photoIndex !== -1) {
            photos.splice(photoIndex, 1);
            localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(photos));
            loadPhotos();
            closeLightbox();
        }
    }
}

function searchPhotos() {
    const searchTerm = searchInput.value.toLowerCase();
    const allPhotos = albums.flatMap(album => 
        JSON.parse(localStorage.getItem(`${album}_photos`)) || []
    );
    const filteredPhotos = allPhotos.filter(photo => 
        photo.caption.toLowerCase().includes(searchTerm) ||
        photo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    displaySearchResults(filteredPhotos);
}

function displaySearchResults(photos) {
    photoContainer.innerHTML = '';
    photos.forEach(photo => {
        const photoElement = createPhotoElement(photo);
        photoContainer.appendChild(photoElement);
    });
}

function selectAllPhotos() {
    const checkboxes = document.querySelectorAll('.photo-item .checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateSelectedPhotos();
}

function togglePhotoSelection(event, photo) {
    if (event.target.checked) {
        selectedPhotos.push(photo);
    } else {
        selectedPhotos = selectedPhotos.filter(p => p.data !== photo.data);
    }
}

function updateSelectedPhotos() {
    selectedPhotos = Array.from(document.querySelectorAll('.photo-item .checkbox:checked'))
        .map(cb => {
            const photoElement = cb.closest('.photo-item');
            return {
                data: photoElement.querySelector('img').src,
                caption: photoElement.querySelector('p').textContent
            };
        });
}

function moveSelectedPhotos() {
    const targetAlbum = prompt('Enter the name of the album to move selected photos to:');
    if (targetAlbum && albums.includes(targetAlbum)) {
        const currentPhotos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
        const targetPhotos = JSON.parse(localStorage.getItem(`${targetAlbum}_photos`)) || [];
        
        selectedPhotos.forEach(photo => {
            const photoIndex = currentPhotos.findIndex(p => p.data === photo.data && p.caption === photo.caption);
            if (photoIndex !== -1) {
                const [movedPhoto] = currentPhotos.splice(photoIndex, 1);
                targetPhotos.push(movedPhoto);
            }
        });
        
        localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(currentPhotos));
        localStorage.setItem(`${targetAlbum}_photos`, JSON.stringify(targetPhotos));
        
        loadPhotos();
        selectedPhotos = [];
    }
}

function deleteSelectedPhotos() {
    if (confirm('Are you sure you want to delete the selected photos?')) {
        const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
        selectedPhotos.forEach(selectedPhoto => {
            const photoIndex = photos.findIndex(p => p.data === selectedPhoto.data && p.caption === selectedPhoto.caption);
            if (photoIndex !== -1) {
                photos.splice(photoIndex, 1);
            }
        });
        localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(photos));
        loadPhotos();
        selectedPhotos = [];
    }
}

let cropper;

function openEditor(photo) {
    lightbox.classList.remove('visible');
    editor.classList.add('visible');
    editorImage.src = photo.data;
    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(editorImage, {
        aspectRatio: NaN,
        viewMode: 1,
    });
}

function cropImage() {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        editorImage.src = croppedCanvas.toDataURL();
        cropper.destroy();
        cropper = new Cropper(editorImage, {
            aspectRatio: NaN,
            viewMode: 1,
        });
    }
}

function rotateImage(degree) {
    if (cropper) {
        cropper.rotate(degree);
    }
}

function applyFilter() {
    const filter = prompt('Enter a CSS filter (e.g., "brightness(150%) contrast(120%)")');
    if (filter) {
        editorImage.style.filter = filter;
    }
}

function saveEdit() {
    const editedImageData = cropper.getCroppedCanvas().toDataURL();
    const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
    const photoIndex = photos.findIndex(p => p.data === editorImage.src);
    if (photoIndex !== -1) {
        photos[photoIndex].data = editedImageData;
        localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(photos));
        loadPhotos();
    }
    cancelEdit();
}

function cancelEdit() {
    if (cropper) {
        cropper.destroy();
    }
    editor.classList.remove('visible');
}

function sharePhoto(photo) {
    const shareUrl = `${window.location.origin}/share.html?album=${currentAlbum}&photo=${encodeURIComponent(photo.data)}`;
    shareLink.value = shareUrl;
    shareModal.classList.add('visible');
}

function copyShareLink() {
    shareLink.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

function closeShareModal() {
    shareModal.classList.remove('visible');
}

function loadTags(photo) {
    tagsList.innerHTML = '';
    photo.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsList.appendChild(tagElement);
    });
}

function addTag() {
    const tag = tagInput.value.trim();
    if (tag) {
        const photos = JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)) || [];
        const photoIndex = photos.findIndex(p => p.data === lightboxImg.src);
        if (photoIndex !== -1) {
            if (!photos[photoIndex].tags) {
                photos[photoIndex].tags = [];
            }
            photos[photoIndex].tags.push(tag);
            localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(photos));
            loadTags(photos[photoIndex]);
            tagInput.value = '';
        }
    }
}

function initializeSortable() {
    new Sortable(photoContainer, {
        animation: 150,
        onEnd: function() {
            const newOrder = Array.from(photoContainer.children).map(item => ({
                data: item.querySelector('img').src,
                caption: item.querySelector('p').textContent,
                tags: JSON.parse(localStorage.getItem(`${currentAlbum}_photos`)).find(p => p.data === item.querySelector('img').src).tags
            }));
            localStorage.setItem(`${currentAlbum}_photos`, JSON.stringify(newOrder));
        }
    });
}