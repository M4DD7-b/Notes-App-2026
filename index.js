// ensures script runs only after HTML document has finished loading.
document.addEventListener("DOMContentLoaded", function () {
    /*
        assign JavaScript variables to HTML elements for later manipulation
        each variable corresponds to a specific element identified by its ID
    */
    const notesContainer = document.getElementById("notesContainer");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const addNoteModal = document.getElementById("addNoteModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const noteForm = document.getElementById("noteForm");
    const searchInput = document.getElementById("searchInput");
    const filterSelect = document.getElementById("filterSelect");
    const emptyState = document.getElementById("emptyState");
    const confirmModal = document.getElementById("confirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    // retrieve previously stored notes from local storage
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    // if no notes are found, default to an empty array
    let noteToDeleteId = null;

    renderNotes(); // display existing notes
    updateEmptyState(); // update state of app to retrieve new notes

    /*
        attach functions to events on an element
        i.e. clicking addNoteBtn opens a modal
    */
    addNoteBtn.addEventListener("click", openAddNoteModal);
    closeModalBtn.addEventListener("click", closeAddNoteModal);
    noteForm.addEventListener("submit", handleNoteSubmit);
    searchInput.addEventListener("input", filterNotes);
    filterSelect.addEventListener("change", filterNotes);
    cancelDeleteBtn.addEventListener("click", closeConfirmModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);

    /*
        clears previous content inside notesContainer and renders the notes passed to it
        (or all notes by default)
    */
    function renderNotes(notesToRender = notes) {
        notesContainer.innerHTML = "";

        // for each note, assign it the note-card and fade-in classes for styling
        notesToRender.forEach((note, index) => {
            const noteElement = document.createElement("div");
            noteElement.className = "note-card fade-in";
            // dynamically incorporate note title, content, tag, and date, using helper functions
            noteElement.innerHTML = `
            <div class="note-content">
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-actions">
                        <button class="delete-btn" data-id="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="note-text">${note.content}</p>
                <div class="note-footer">
                    <span class="note-tag ${getTagClass(note.tag)}">
                        ${getTagIcon(note.tag)} ${getTagName(note.tag)}
                    </span>
                    <span class="note-date">${formatDate(note.date)}</span>
                </div>
            </div>`;
            notesContainer.appendChild(noteElement);
        });

        // assign a click event to each delete button, setting noteToDeleteId
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                noteToDeleteId = parseInt(this.getAttribute("data-id"));
                openConfirmModal();
            });
        });
    }

    /*
        three functions, getTagClass, getTagIcon, and getTagName, map
        tag types to class names, icons, and display names
    */
    function getTagClass(tag) {
        const classes = {
            work: "tag-work",
            personal: "tag-personal",
            ideas: "tag-ideas",
            reminders: "tag-reminders",
        };
        return classes[tag] || "";
    }

    function getTagIcon(tag) {
        const icons = {
            work: '<i class="fas fa-briefcase"></i>',
            personal: '<i class="fas fa-user"></i>',
            ideas: '<i class="fas fa-lightbulb"></i>',
            reminders: '<i class="fas fa-bell"></i>',
        };
        return icons[tag] || "";
    }

    function getTagName(tag) {
        const names = {
            work: "Work",
            personal: "Personal",
            ideas: "Ideas",
            reminders: "Reminders",
        };
        return names[tag] || tag;
    }

    // takes a date string, converts it to an object, and formats it
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-UK", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // makes the modal for adding a note visible and disables scrolling on the body
    function openAddNoteModal() {
        addNoteModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    // hides the modal and resets the form fields when the modal is closed
    function closeAddNoteModal() {
        addNoteModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteForm.reset();
    }

    // displays confirmation modal for deleting a node
    function openConfirmModal() {
        confirmModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    // hides the confirmation modal and resets the ID of the note to delete
    function closeConfirmModal() {
        confirmModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteToDeleteId = null;
    }

    /*
        triggered when the note form is submitted:
            prevents default form submission behavior
            retrieves the title, content, and selected tag from the form
            creates a new note object with the current data
            adds note to the beginning of the notes array, saves it,
            and renders the updated list
            also updates the empty state and applies any filters
    */
    function handleNoteSubmit(e) {
        e.preventDefault();

        const title = document.getElementById("noteTitle").value;
        const content = document.getElementById("noteContent").value;
        const tag = document.querySelector(
            'input[name="noteTag"]:checked'
        ).value;

        const newNote = {
            title,
            content,
            tag,
            date: new Date().toISOString(),
        };

        notes.unshift(newNote);
        saveNotes();
        renderNotes();
        closeAddNoteModal();
        updateEmptyState();
        filterNotes();
    }

    /*
        triggered when the user confirms the deletion of a note
            checks if there is a valid noteToDeleteId
            removes the note from the notes array using splice,
            saves the changes, re-renders the notes, and updates empty state
    */
    function confirmDeleteNote() {
        if (noteToDeleteId !== null) {
            notes.splice(noteToDeleteId, 1);
            saveNotes();
            renderNotes();
            updateEmptyState();
            filterNotes();
            closeConfirmModal();
        }
    }

    /*
        stores the current notes array in local storage as a JSON
        string, allowing persistent note storage across page reloads
    */
    function saveNotes() {
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    /*
        converts search term to lowercase and initialises filteredNotes
        with the full notes array
        if a search term is provided, filter notes whose titles or contents
        include that term
        it also filters by tag if the selected value is not all
        renders the filtered notes and updates the empty state
    */
    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        let filteredNotes = notes;

        if (searchTerm) {
            filteredNotes = filteredNotes.filter(
                (note) =>
                    note.title.toLowerCase().includes(searchTerm) ||
                    note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filterValue !== "all") {
            filteredNotes = filteredNotes.filter(
                (note) => note.tag === filterValue
            );
        }

        renderNotes(filteredNotes);
        updateEmptyState(filteredNotes);
    }

    /*
        shows and hides messages indicating there are no notes
            optional parameter: notesToCheck
            if notesToCheck is empty, empty state message is
            displayed by changing display setting to block
            otherwise, hide message by setting display to none
    */
    function updateEmptyState(notesToCheck = notes) {
        if (notesToCheck.length === 0) {
            emptyState.style.display = "block";
        } else {
            emptyState.style.display = "none";
        }
    }
});