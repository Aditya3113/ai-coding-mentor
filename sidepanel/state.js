// --- GLOBAL STATE & DOM ELEMENTS ---
var globalUser = null;
var globalIsPremium = false;
var globalDatabaseArray = [];

var timerInterval = null;
var timerSecondsRemaining = 0;
var isTimerRunning = false;

// Header & Auth
const authProfileBtn = document.getElementById('authProfileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const dropdownEmail = document.getElementById('dropdownEmail');
const signOutBtn = document.getElementById('signOutBtn');

// Tabs & Containers
const tabActive = document.getElementById('tabActive');
const tabCompany = document.getElementById('tabCompany');
const navTabsContainer = document.querySelector('.nav-tabs');
const activeProblemContainer = document.getElementById('activeProblemContainer');
const companyPrepState = document.getElementById('companyPrepState');

// Active Problem States
const idleState = document.getElementById('idleState');
const lockdownState = document.getElementById('lockdownState');
const dashboardState = document.getElementById('dashboardState');
const headerTitle = document.getElementById('headerTitle');
const difficultyBadge = document.getElementById('difficultyBadge');

// Timer
const pressureTimer = document.getElementById('pressureTimer');
const timerInput = document.getElementById('timerInput');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');

// Company Prep
const companyTags = document.getElementById('companyTags');
const companySelect = document.getElementById('companySelect');
const topicSelect = document.getElementById('topicSelect');
const sortSelect = document.getElementById('sortSelect');
const questionList = document.getElementById('questionList');

// Utility Bar
const themeSelect = document.getElementById('themeSelect');
const btnFormatCode = document.getElementById('btnFormatCode');