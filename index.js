const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const readline = require("readline");
const path = require("path");
const lib = require("./lib");
const dbg = require("./dbg");
const DispatchWrapper = require("./dispatch");

let voice = null;
try {
	voice = require("./voice");
} catch (e) {
	voice = null;
}

module.exports = function TeraGuide(mod) {
	const dispatch = new DispatchWrapper(mod);
	const command = mod.command;
	const { player, entity, library, effect } = mod.require.library;

	// Available strings for different languages
	const translation = {
		// Russian
		ru: {
			unknowncommand: "Невереная команда, введите guide help",
			helpheader: "Введите \"guide help\" для вывода справки",
			helpbody: [
				["guide, вкл./выкл. модуля", "PRMSG"],
				["guide gui, показать графический интерфейс", "PRMSG"],
				["guide voice, вкл./выкл. голосовые сообщения", "PRMSG"],
				["guide lNotice, вкл./выкл. отправки сообщений в канал чата", "PRMSG"],
				["guide gNotice, вкл./выкл. отправки сообщений в чат группы", "PRMSG"],
				["guide 1~10, регулировка скорости чтения голосовых сообщений", "PRMSG"],
				["guide spawnObject, вкл./выкл. спавна маркировочных объектов", "PRMSG"],
				["guide stream, вкл./выкл. режима стрима (скрытие сообщений и объектов)", "PRMSG"],
				["guide dungeons, список всех поддерживаемых данжей и их id", "PRMSG"],
				["guide verbose id, вкл./выкл. всех сообщений для данжа, где id - идентификатор данжа", "PRMSG"],
				["guide spawnObject id, вкл./выкл. спавна объектов для данжа, где id - идентификатор данжа", "PRMSG"],
				["guide cc, отобразить текущий цвет системного сообщения", "PRMSG"],
				["guide cr, установить цвет сообщения: красный", "CRMSG"],
				["guide c, установить цвет сообщения: оранжевый", "COMSG"],
				["guide cy, установить цвет сообщения: желтый", "CYMSG"],
				["guide cg, установить цвет сообщения: зеленый", "CGMSG"],
				["guide cdb, установить цвет сообщения: темно-синий", "CDBMSG"],
				["guide cb, установить цвет сообщения: синий", "CBMSG"],
				["guide cv, установить цвет сообщения: фиолетовый", "CVMSG"],
				["guide cp, установить цвет сообщения: розовый", "CPMSG"],
				["guide clp, установить цвет сообщения: светло-розовый", "CLPMSG"],
				["guide clb, установить цвет сообщения: светло-синий", "CLBMSG"],
				["guide cbl, установить цвет сообщения: черный", "CBLMSG"],
				["guide cgr, установить цвет сообщения: серый", "CGRMSG"],
				["guide cw, установить цвет сообщения: белый", "CWMSG"],
			],
			red: "Красный",
			green: "Зеленый",
			settings: "Настройки",
			spawnObject: "Спавн объектов",
			speaks: "Голосовые сообщения",
			lNotice: "Сообщения в чат",
			gNotice: "Отправка сообщений членам группы",
			stream: "Режим стримера",
			rate: "Скорость речи",
			color: "Выбор цвета",
			dungeons: "Настройки данжей",
			verbose: "Сообщения",
			objects: "Объекты",
			test: "Проверка",
			module: "Модуль TERA-Guide",
			enabled: "Вкл.",
			disabled: "Выкл.",
			voicetest: "[Проверка скорости чтения сообщений]",
			colorchanged: "Цвет текста сообщений изменен",
			ratechanged: "Скорость речи изменена на",
			dgnotfound: "Данж с таким id не найден.",
			dgnotspecified: "Не указан id данжа.",
			enterdg: "Вы вошли в данж",
			enterspdg: "Вы вошли в SP данж",
			enteresdg: "Вы вошли в ES данж",
			fordungeon: "для данжа",
		},
		// English
		en: {
			unknowncommand: "Unknown command, type \"guide help\"",
			helpheader: "Enter \"guide help\" for more information",
			helpbody: [
				["guide, module on/off", "PRMSG"],
				["guide gui, show module GUI", "PRMSG"],
				["guide voice, text-to-speech (TTS) notices on/off", "PRMSG"],
				["guide lNotice, send notices to chat on/off", "PRMSG"],
				["guide gNotice, send notices to party chat channel on/off", "PRMSG"],
				["guide 1~10, to settings TTS speech rate", "PRMSG"],
				["guide spawnObject, spawn marker objects on/off", "PRMSG"],
				["guide stream, streamer mode on/off", "PRMSG"],
				["guide dungeons, list of all supported dungeons", "PRMSG"],
				["verbose id, send notices for specified dungeon on/off", "PRMSG"],
				["guide spawnObject id, spawn marker objects for specified dungeon on/off", "PRMSG"],
				["guide cc, view the current system message notification color", "PRMSG"],
				["guide cr, message color is RED", "CRMSG"],
				["guide co, message color is ORANGE", "COMSG"],
				["guide cy, message color is YELLOW", "CYMSG"],
				["guide cg, message color is GREEN", "CGMSG"],
				["guide cdb, message color is DARK BLUE", "CDBMSG"],
				["guide cb, message color is BLUE", "CBMSG"],
				["guide cv, message color is VIOLET", "CVMSG"],
				["guide cp, message color is PINK", "CPMSG"],
				["guide clp, message color is LIGHT PINK", "CLPMSG"],
				["guide clb, message color is LIGHT BLUE", "CLBMSG"],
				["guide cbl, message color is BLACK", "CBLMSG"],
				["guide cgr, message color is GRAY", "CGRMSG"],
				["guide cw, message color is WHITE", "CWMSG"],
			],
			red: "Red",
			green: "Green",
			settings: "Settings",
			spawnObject: "Spawn objects",
			speaks: "Voice messages",
			lNotice: "Chat messages",
			gNotice: "Send messages to party members",
			stream: "Streamer Mode",
			rate: "Speech rate",
			color: "Change color",
			dungeons: "Dungeon settings",
			verbose: "Messages",
			objects: "Objects",
			test: "Test",
			module: "TERA-Guide module",
			enabled: "On",
			disabled: "Off",
			voicetest: "[Voice speech rate test]",
			colorchanged: "Message notification color is changed",
			ratechanged: "Voice speed changed to",
			dgnotfound: "Dungeon not found.",
			dgnotspecified: "Dungeon id not specified.",
			enterdg: "Enter Dungeon",
			enterspdg: "Enter SP Dungeon",
			enteresdg: "Enter ES Dungeon",
			fordungeon: "for dungeon",
		},
		// Español
		es: {
			unknowncommand: "Comando desconocido, escriba \"guide help\"",
			helpheader: "Escriba \"guide help\" para obtener más información",
			helpbody: [
				["guide, módulo on/off", "PRMSG"],
				["guide gui, mostrar módulo GUI", "PRMSG"],
				["guide voice, avisos de texto a voz (TTS)", "PRMSG"],
				["guide lNotice, enviar avisos en el chat", "PRMSG"],
				["guide gNotice, enviar avisos en el canal de chat del grupo", "PRMSG"],
				["guide 1~10, ajustar la velocidad de voz TTS", "PRMSG"],
				["guide spawnObject, generación de objetos", "PRMSG"],
				["guide stream, modo streamer", "PRMSG"],
				["guide dungeons, lista de todas las dungeons compatibles", "PRMSG"],
				["verbose id, enviar avisos para dungeons específicas", "PRMSG"],
				["guide spawnObject id, generación de objetos para dungeons específicas", "PRMSG"],
				["guide cc, ver el color de notificación del mensaje del sistema actual", "PRMSG"],
				["guide cr, el color del mensaje es ROJO", "CRMSG"],
				["guide co, el color del mensaje es NARANJA", "COMSG"],
				["guide cy, el color del mensaje es AMARILLO", "CYMSG"],
				["guide cg, el color del mensaje es VERDE", "CGMSG"],
				["guide cdb, el color del mensaje es AZUL OSCURO", "CDBMSG"],
				["guide cb, el color del mensaje es AZUL", "CBMSG"],
				["guide cv, el color del mensaje es VIOLETA", "CVMSG"],
				["guide cp, el color del mensaje es ROSA", "CPMSG"],
				["guide clp, el color del mensaje es ROSA CLARO", "CLPMSG"],
				["guide clb, el color del mensaje es AZUL CLARO", "CLBMSG"],
				["guide cbl, el color del mensaje es NEGRO", "CBLMSG"],
				["guide cgr, el color del mensaje es GRIS", "CGRMSG"],
				["guide cw, el color del mensaje es BLANCO", "CWMSG"],
			],
			red: "Rojo",
			green: "Verde",
			settings: "Ajustes",
			spawnObject: "Generación de objetos",
			speaks: "Mensajes de voz",
			lNotice: "Mensajes de chat",
			gNotice: "Enviar mensajes a las miembros del grupo",
			stream: "Modo Streamer",
			rate: "Velocidad de voz",
			color: "Cambiar el color",
			dungeons: "Ajustes de Mazmorras",
			verbose: "Mensajes",
			objects: "Objetos",
			test: "Prueba",
			module: "Módulo TERA-Guía",
			enabled: "Encendido",
			disabled: "Apagado",
			voicetest: "[Prueba de velocidad de voz]",
			colorchanged: "El color de la notificación del mensaje ha cambiado",
			ratechanged: "La velocidad de la voz cambió a",
			dgnotfound: "Mazmorra no encontrada.",
			dgnotspecified: "ID de Mazmorra no especificada.",
			enterdg: "¡Bienvenido! a la Mazmorra",
			enterspdg: "¡Bienvenido! a la Mazmorra SP",
			enteresdg: "¡Bienvenido! a la Mazmorra ES",
			fordungeon: "para Mazmorra",
		},		
	};

	// A boolean for the debugging settings
	let debug = dbg["debug"];

	// Guide files directory name
	const GUIDES_DIR = "./guides";

	// Tank class ids(brawler + lancer)
	const TANK_CLASS_IDS = [1, 10];
	// Dps class ids(not counting warrior)
	const DPS_CLASS_IDS = [2, 3, 4, 5, 8, 9, 11, 12];
	// Healer class ids
	const HEALER_CLASS_IDS = [6, 7];
	// Warrior Defence stance abnormality ids
	const WARRIOR_TANK_IDS = [100200, 100201];

	// Zones with skillid range 1000-3000
	const SP_ZONE_IDS = [
		3026, // Corrupted Skynest
		3126, // Corrupted Skynest (Hard)
		9050, // Rift's Edge (Hard)
		9054, // Bathysmal Rise (Hard)
		9044, // Bahaar's Sanctum
		9066, // Demon's Wheel
		9070, // Manglemire
		9750, // Rift's Edge
		9754, // Bathysmal Rise
		9781, // Velik's Sanctuary
		9916, // Sky Cruiser Endeavor (Hard)
		9920, // Antaroth's Abyss (Hard)
		9970, // Ruinous Manor (Hard)
		9981  // Velik's Sanctuary (Hard)
	];
	// Zones with skillid range 100-200-3000
	const ES_ZONE_IDS = [
		3023, // Akalath Quarantine
		9000, // ???
		9759  // Forsaken Island (Hard)
	];

	// Messages colors
	const cr = '</font><font color="#ff0000">';  // red
	const co = '</font><font color="#ff7700">';  // orange
	const cy = '</font><font color="#ffff00">';  // yellow
	const cg = '</font><font color="#00ff00">';  // green
	const cdb = '</font><font color="#2727ff">'; // dark blue
	const cb = '</font><font color="#0077ff">';  // blue
	const cv = '</font><font color="#7700ff">';  // violet
	const cp = '</font><font color="#ff00ff">';  // pink
	const clp = '</font><font color="#ff77ff">'; // light pink
	const clb = '</font><font color="#00ffff">'; // light blue
	const cbl = '</font><font color="#000000">'; // black
	const cgr = '</font><font color="#777777">'; // gray
	const cw = '</font><font color="#ffffff">';  // white
	// GUI colors
	const gcr = '#fe6f5e';  // red
	const gcg = '#4de19c';  // green
	const gcy = '#c0b94d';  // yellow
	const gcgr = '#778899'; // gray
	// Dungeon messages types
	const spt = 31; // text notice
	const spg = 42; // green message
	const spb = 43; // blue message
	const spr = 44; // red message
	const spi = 66; // blue info message
	const spn = 49; // left side notice

	// An object of types and their corresponding function handlers
	const eventHandlers = {
		"spawn": spawnHandler,
		"despawn": despawnHandler,
		"text": textHandler,
		"func": funcHandler,
		"spawn_func": spawnFuncHandler
	};
	// Default dungeon guide settings
	const defaultSettings = {
		verbose: true,
		spawnObject: true
	};
	// Entered zone guide data
	let guide = {
		id: undefined,
		name: undefined,
		loaded: false,
		object: null,
		event: null,
		ent: null,
		es: false,
		sp: false,
		mobshp: {}
	};
	// Add default settings to guide object
	Object.assign(guide, defaultSettings);

	// Detected language
	let language = null;
	let uclanguage = null;
	// Current language strings
	let lang = {};
	// Used for item unique id in spawn handler
	let uint64 = 0xFFFFFFFA;


	/** COMMANDS FUNCTIONS **/

	command.add(["guide"], {
		// Toggle debug settings
		debug(arg1) {
			if (!arg1) {
				arg1 = "all";
			} else if (arg1 === "status") {
				for (let [key, value] of Object.entries(debug)) {
					command.message(`debug(${key}): ${value ? "enabled" : "disabled"}.`);
				}
				return;
			} else if (debug[arg1] === undefined) {
				return command.message(`Invalid sub command for debug mode. ${arg1}`);
			}
			debug[arg1] = !debug[arg1];
			command.message(`Guide module debug(${arg1}) mode has been ${debug[arg1] ? "enabled" : "disabled"}.`);
		},
		// Testing events
		event(arg1, arg2) {
			// If arg1 is "load", load guide from arg2 specified
			if (arg1 === "load") {
				if (!arg2) return command.message(`Invalid values for sub command "event" ${arg1}`);
				return loadZoneHandler(arg2, true);
			}
			// If arg1 is "reload", reload current loaded guide
			if (arg1 === "reload") {
				if (!guide.loaded) return command.message("Guide not loaded");
				return loadZoneHandler(guide.id, true);
			}
			// If we didn't get a second argument or the argument value isn't an event type, we return
			if (arg1 === "trigger" ? (!guide.object[arg2]) : (!arg1 || !eventHandlers[arg1] || !arg2)) return command.message(`Invalid values for sub command "event" ${arg1} | ${arg2}`);
			// if arg2 is "trigger". It means we want to trigger a event
			if (arg1 === "trigger") {
				startEvents(guide.object[arg2], player);
			} else {
				try {
					// Call a function handler with the event we got from arg2 with yourself as the entity
					eventHandlers[arg1](JSON.parse(arg2), player);
				} catch (e) {
					mod.error(e);
				}
			}
		},
		spawnObject(arg1) {
			if (arg1) {
				if (mod.settings.dungeons[arg1]) {
					mod.settings.dungeons[arg1].spawnObject = !mod.settings.dungeons[arg1].spawnObject;
					textHandler({
						"sub_type": "PRMSG",
						"message": `${lang.spawnObject} ${lang.fordungeon} "${mod.settings.dungeons[arg1].name}": ${mod.settings.dungeons[arg1].spawnObject ? lang.enabled : lang.disabled}`
					});
					// Reload settings for entered guide
					Object.assign(guide, mod.settings.dungeons[arg1]);
				} else {
					textHandler({
						"sub_type": "PRMSG",
						"message": lang.dgnotfound
					});
				}
			} else {
				mod.settings.spawnObject = !mod.settings.spawnObject;
				textHandler({
					"sub_type": "PRMSG",
					"message": `${lang.spawnObject} ${mod.settings.spawnObject ? lang.enabled : lang.disabled}`
				});
			}
		},
		verbose(arg1) {
			if (arg1) {
				if (mod.settings.dungeons[arg1]) {
					mod.settings.dungeons[arg1].verbose = !mod.settings.dungeons[arg1].verbose;
					textHandler({
						"sub_type": "PRMSG",
						"message": `${lang.verbose} ${lang.fordungeon} "${mod.settings.dungeons[arg1].name}": ${mod.settings.dungeons[arg1].verbose ? lang.enabled : lang.disabled}`
					});
					// Reload settings for entered guide
					Object.assign(guide, mod.settings.dungeons[arg1]);
				} else {
					textHandler({
						"sub_type": "PRMSG",
						"message": lang.dgnotfound
					});
				}
			} else {
				textHandler({
					"sub_type": "PRMSG",
					"message": lang.dgnotspecified
				});
			}
		},
		voice() {
			mod.settings.speaks = !mod.settings.speaks;
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.speaks}: ${mod.settings.speaks ? lang.enabled : lang.disabled}`
			});
		},
		stream() {
			mod.settings.stream = !mod.settings.stream;
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.stream}: ${mod.settings.stream ? lang.enabled : lang.disabled}`
			});
		},
		lNotice() {
			mod.settings.lNotice = !mod.settings.lNotice;
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.lNotice}: ${mod.settings.lNotice ? lang.enabled : lang.disabled}`
			});
		},
		gNotice() {
			mod.settings.gNotice = !mod.settings.gNotice;
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.gNotice}: ${mod.settings.gNotice ? lang.enabled : lang.disabled}`
			});
		},
		dungeons() {
			for (const [id, dungeon] of Object.entries(mod.settings.dungeons)) {
				if (!dungeon.name) continue;
				textHandler({
					"sub_type": "PRMSG",
					"message": `${id} - ${dungeon.name}`
				});
			}
		},
		gui() {
			guiHandler("index", "TERA-Guide");
		},
		help() {
			for (const helpstring of lang.helpbody) {
				textHandler({
					"sub_type": helpstring[1],
					"message": helpstring[0]
				});
			}
		},
		guivoicetest() {
			voice.speak(lang.voicetest, mod.settings.rate);
			textHandler({
				"sub_type": "PRMSG",
				"message": lang.voicetest
			});
		},
		$default(arg1) {
			// Enable/Disable the module
			if (arg1 === undefined) {
				mod.settings.enabled = !mod.settings.enabled;
				textHandler({
					"sub_type": "PRMSG",
					"message": `${lang.module}: ${mod.settings.enabled ? lang.enabled : lang.disabled}`,
				});
			// Set messages text color
			} else if (["cr", "co", "cy", "cg", "cv", "cb", "clb", "cdb", "cp", "clp", "cw", "cgr", "cbl"].includes(arg1)) {
				mod.settings.cc.splice(0, 1, eval(arg1));
				textHandler({
					"sub_type": "PRMSG",
					"message": lang.colorchanged
				});
				if (!mod.settings.lNotice && !mod.settings.stream) {
					sendDungeonEvent(lang.colorchanged, mod.settings.cc, spg);
				}
			// Set voice rate
			} else if (parseInt(arg1) >= 1 && parseInt(arg1) <= 10) {
				textHandler({
					"sub_type": "PRMSG",
					"message": `${lang.ratechanged} ${arg1}`
				});
				mod.settings.rate.splice(0, 1, parseInt(arg1));
			// Unknown command
			} else {
				textHandler({
					"sub_type": "PRMSG",
					"message": lang.unknowncommand
				});
			}
		}
	});


	/** GUI FUNCTIONS **/

	mod.hook("C_CONFIRM_UPDATE_NOTIFICATION", "raw", { order: 100010 }, () => false);
	mod.hook("C_ADMIN", 1, { order: 100010, filter: { fake: null, silenced: false, modified: null } }, (event) => {
		const commands = event.command.split(";");
		for (const cmd of commands) {
			try {
				mod.command.exec(cmd);
			} catch (e) {
				continue;
			}
		}
		return false;
	});

	const gui = {
		parse(array, title) {
			let body = "";
			for (const data of array) {
				if (body.length >= 16000) {
					body += "GUI data limit exceeded, some values may be missing.";
					break;
				}
				if (data.command) body += `<a href="admincommand:/@${data.command}">${data.text}</a>`;
				else if (!data.command) body += `${data.text}`;
				else continue;
			}
			mod.toClient("S_ANNOUNCE_UPDATE_NOTIFICATION", 1, { id: 0, title, body });
		}
	}

	function guiHandler(page, title) {
		let tmp_data = [];
		switch (page) {
			default:
				tmp_data.push(
					{ text: `<font color="${gcy}" size="+20">${lang.settings}:</font>` }, { text: "&#09;&#09;&#09;" },
					{ text: `<font color="${mod.settings.spawnObject ? gcg : gcr}" size="+18">[${lang.spawnObject}]</font>`, command: "guide spawnObject;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.speaks ? gcg : gcr}" size="+18">[${lang.speaks}]</font>`, command: "guide voice;guide gui" },
					{ text: "<br>&#09;&#09;&#09;&#09;&#09;" },
					{ text: `<font color="${mod.settings.lNotice ? gcg : gcr}" size="+18">[${lang.lNotice}]</font>`, command: "guide lNotice;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.stream ? gcg : gcr}" size="+18">[${lang.stream}]</font>`, command: "guide stream;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<br><br>` },
					{ text: `<font color="${gcy}" size="+20">${lang.rate}:</font>` }, { text: "&#09;&#09;" },
					{ text: `<font color="${mod.settings.rate[0] == 1 ? gcg : gcr}" size="+18">[1]</font>`, command: "guide 1;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 2 ? gcg : gcr}" size="+18">[2]</font>`, command: "guide 2;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 3 ? gcg : gcr}" size="+18">[3]</font>`, command: "guide 3;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 4 ? gcg : gcr}" size="+18">[4]</font>`, command: "guide 4;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 5 ? gcg : gcr}" size="+18">[5]</font>`, command: "guide 5;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 6 ? gcg : gcr}" size="+18">[6]</font>`, command: "guide 6;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 7 ? gcg : gcr}" size="+18">[7]</font>`, command: "guide 7;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 8 ? gcg : gcr}" size="+18">[8]</font>`, command: "guide 8;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 9 ? gcg : gcr}" size="+18">[9]</font>`, command: "guide 9;guide gui" }, { text: "&nbsp;&nbsp;" },
					{ text: `<font color="${mod.settings.rate[0] == 10 ? gcg : gcr}" size="+18">[10]</font>`, command: "guide 10;guide gui" }, { text: "&nbsp;&nbsp;&nbsp;&nbsp;" },
					{ text: `<font size="+18">[${lang.test}]</font>`, command: "guide guivoicetest" },
					{ text: `<br>` }
				);
				tmp_data.push(
					{ text: `<font color="${gcy}" size="+20">${lang.color}:</font>` }, { text: "&#09;&#09;" }
				);
				for (const color of ["cr", "co", "cy", "cg", "cv", "cb", "clb", "cdb", "cp", "clp", "cw", "cgr", "cbl"]) {
					let cc = eval(color);
					tmp_data.push({ text: `<font color="${mod.settings.cc[0] === cc ? gcg : gcr}" size="+18">[${color.substr(1).toUpperCase()}]</font>`, command: "guide " + color + ";guide gui" }, { text: "&nbsp;&nbsp;" });
				}
				tmp_data.push(
					{ text: `<br><br>` },
					{ text: `<font color="${gcy}" size="+20">${lang.dungeons}:</font><br>` }
				);
				for (const [id, dungeon] of Object.entries(mod.settings.dungeons)) {
					if (!dungeon.name) continue;
					tmp_data.push({ text: `<font color="${dungeon.spawnObject ? gcg : gcr}" size="+18">[${lang.objects}]</font>`, command: "guide spawnObject " + id + ";guide gui" }, { text: "&nbsp;&nbsp;" });
					tmp_data.push({ text: `<font color="${dungeon.verbose ? gcg : gcr}" size="+18">[${lang.verbose}]</font>`, command: "guide verbose " + id + ";guide gui" }, { text: "&nbsp;&#8212;&nbsp;" });
					tmp_data.push({ text: `<font color="${gcgr}" size="+20">${dungeon.name}</font>` });
					tmp_data.push({ text: "<br>" });
				}
				gui.parse(tmp_data, `<font>${title}</font> | <font color="${gcr}" size="+16">${lang.red}</font><font color="${gcgr}" size="+16"> = ${lang.disabled}, <font color="${gcg}" size="+16">${lang.green}</font><font color="${gcgr}" size="+16"> = ${lang.enabled}</font>`)
		}
		tmp_data = [];
	}


	/** EVENTS AND HOOKS **/

	// Set client language and load guides configuration
	mod.game.on("enter_game", () => {
		// Supported languages by client
		const languages = { 0: "en", 1: "kr", 3: "jp", 4: "de", 5: "fr", 7: "tw", 8: "ru" };
		// Set client language
		if (!mod.settings.language || mod.settings.language == "auto") {
			language = languages[mod.game.language] || languages[0];
		} else {
			language = mod.settings.language.toLowerCase();
		}
		uclanguage = language.toUpperCase();
		// Set language strings
		lang = translation[language] || translation["en"];
		// Create dungeon configuration
		initConfiguration();
	});

	// Clear out the timers when leave the game
	mod.game.on("leave_game", () => {
		mod.clearAllTimeouts();
		mod.clearAllIntervals();
	});

	// Load guide when entry new zone
	mod.game.me.on("change_zone", (zone, quick) => {
		loadZoneHandler(zone, false);
	});

	// Boss skill action
	mod.hook("S_ACTION_STAGE", 9, { order: 15 }, e => {
		// Return if any of the below is false
		if (!mod.settings.enabled || !guide.loaded || !guide.verbose || !e.skill.npc) return;
		let skillid = e.skill.id % 1000;
		let eskillid = e.skill.id > 3000 ? e.skill.id : e.skill.id % 1000;
		const ent = entity["mobs"][e.gameId.toString()];
		// Due to a bug for some bizare reason(probably proxy fucking itself) we do this ugly hack
		e.loc.w = e.w;
		// We've confirmed it's a mob, so it's plausible we want to act on this
		if (!ent) return;
		if (guide.sp) {
			return handleEvent(Object.assign({}, ent, e), e.skill.id, "Skill", "s", debug.all || debug.skill || (ent.templateId % 1 === 0 ? debug.boss : false), e.speed, e.stage);
		} else if (guide.es) {
			return handleEvent(Object.assign({}, ent, e), eskillid, "Skill", "s", debug.all || debug.skill || (ent.templateId % 1 === 0 ? debug.boss : false), e.speed, e.stage);
		} else {
			return handleEvent(Object.assign({}, ent, e), skillid, "Skill", "s", debug.all || debug.skill || (ent.templateId % 1 === 0 ? debug.boss : false), e.speed, e.stage);
		}
	});

	// Boss abnormality triggered
	function abnormality_triggered(e) {
		// Return if any of the below is false
		if (!mod.settings.enabled || !guide.loaded || !guide.verbose) return;
		// avoid errors ResidentSleeper (neede for abnormality refresh)
		if (!e.source) e.source = 0n;
		// If the boss/mob get"s a abnormality applied to it
		const target_ent = entity["mobs"][e.target.toString()];
		// If the boss/mob is the cause for the abnormality
		const source_ent = entity["mobs"][e.source.toString()];
		// If the mob/boss applies an abnormality to me, it"s plausible we want to act on this
		if (source_ent && player.isMe(e.target))
			handleEvent(source_ent, e.id, "Abnormality", "am", debug.all || debug.abnormal);
		// If "nothing"/server applies an abnormality to me, it"s plausible we want to act on this. (spam rip)
		if (player.isMe(e.target) && 0 == (e.source || 0))
			handleEvent({
				huntingZoneId: 0,
				templateId: 0
			}, e.id, "Abnormality", "ae", debug.all || debug.abnormal);
		// If it"s a mob/boss getting an abnormality applied to itself, it"s plausible we want to act on it
		if (target_ent)
			handleEvent(target_ent, e.id, "Abnormality", "ab", debug.all || debug.abnormal);
	}
	mod.hook("S_ABNORMALITY_BEGIN", 4, { order: 15 }, abnormality_triggered);
	mod.hook("S_ABNORMALITY_REFRESH", 2, { order: 15 }, abnormality_triggered);

	// Boss health bar triggered
	mod.hook("S_BOSS_GAGE_INFO", 3, e => {
		// Return if any of the below is false
		if (!mod.settings.enabled || !guide.loaded || !guide.verbose) return;
		const ent = entity["mobs"][e.id.toString()];
		const hp = Math.floor(Number(e.curHp) / Number(e.maxHp) * 100);
		const key = `${ent.huntingZoneId}-${ent.templateId}`;
		// Check mob's hp of existing value for single call the event
		if (ent && guide.mobshp[key] == hp) return;
		guide.mobshp[key] = hp;
		// We"ve confirmed it"s a mob, so it"s plausible we want to act on this
		handleEvent(ent, hp, "Health", "h", debug.all || debug.hp);
	});

	// Dungeon event message
	mod.hook("S_DUNGEON_EVENT_MESSAGE", 2, e => {
		// Return if any of the below is false
		if (!mod.settings.enabled || !guide.loaded || !guide.verbose) return;
		const result = /@dungeon:(\d+)/g.exec(e.message);
		if (result) {
			handleEvent({
				huntingZoneId: 0,
				templateId: 0
			}, parseInt(result[1]), "Dungeon Message", "dm", debug.all || debug.dm);
		}
	});

	// Quest balloon
	mod.hook("S_QUEST_BALLOON", 1, e => {
		// Return if any of the below is false
		if (!mod.settings.enabled || !guide.loaded || !guide.verbose) return;
		const source_ent = entity["mobs"][e.source.toString()];
		const result = /@monsterBehavior:(\d+)/g.exec(e.message);
		if (result && source_ent)
			handleEvent(source_ent, parseInt(result[1]), "Quest Balloon", "qb", debug.all || debug.qb);
	});


	/** SEND MESSAGE FUNCTIONS **/

	// Basic message
	function sendMessage(message) {
		// If streamer mode is enabled send message to the proxy-channel
		if (mod.settings.stream) {
			command.message(mod.settings.cc + message);
			return;
		}
		if (mod.settings.lNotice) {
			// Send message as a Team leader notification
			mod.toClient("S_CHAT", 3, {
				channel: 21, // 21 = team leader, 25 = raid leader, 1 = party, 2 = guild
				message
			});
		} else {
			// Send message as a green colored Dungeon Event
			sendDungeonEvent(message, mod.settings.cc, spg);
		}
		// Send message to party if gNotice is enabled
		if (mod.settings.gNotice) {
			mod.toClient("S_CHAT", 3, {
				channel: 1,
				message
			});
		}
	}

	// Notification message
	function sendNotification(message) {
		// If streamer mode is enabled send message to the proxy-channel
		if (mod.settings.stream) {
			command.message(clb + "[Notice] " + mod.settings.cc + message);
			return;
		}
		// Send message as a Raid leader notification
		mod.toClient("S_CHAT", 3, {
			channel: 25,
			authorName: "guide",
			message
		});
		// Send message to party if gNotice is enabled
		if (mod.settings.gNotice) {
			mod.toClient("S_CHAT", 3, {
				channel: 1,
				message
			});
		}
	}

	// Alert message
	function sendAlert(message, cc, spc) {
		// If streamer mode is enabled send message to the proxy-channel
		if (mod.settings.stream) {
			command.message(cc + "[Alert] " + mod.settings.cc + message);
			return;
		}
		if (mod.settings.lNotice) {
			// Send message as a Raid leader notification
			mod.toClient("S_CHAT", 3, {
				channel: 25,
				authorName: "guide",
				message
			});
		} else {
			// Send message as a color-specified Dungeon Event
			sendDungeonEvent(message, mod.settings.cc, spc);
		}
		// Send message to party if gNotice or gAlert is enabled
		if (mod.settings.gNotice/* || mod.settings.gAlert*/) {
			mod.toClient("S_CHAT", 3, {
				channel: 1,
				message
			});
		}
	}

	// Dungeon Event message
	function sendDungeonEvent(message, spcc, type) {
		// If streamer mode is enabled send message to the proxy-channel
		if (mod.settings.stream) {
			command.message(spcc + message);
			return;
		}
		// Send a color-specified Dungeon Event message
		mod.toClient("S_DUNGEON_EVENT_MESSAGE", 2, {
			type: type,
			chat: 0,
			channel: 27,
			message: (spcc + message)
		});
	}

	// Write generic debug message used when creating guides
	function sendDebug(enabled, ...args) {
		if (enabled) {
			console.log(`[${Date.now() % 100000}][Guide]`, ...args);
			if (debug.chat) command.message(args.toString());
		}
	}


	/** FUNCTION/EVENT HANDLERS FOR TYPES **/

	// Spawn handler
	function spawnHandler(event, ent, speed = 1.0) {
		// Callback function
		const callback = (sub_type, sending_event) => {
			switch (sub_type) {
				case "collection":
					return mod.toClient("S_SPAWN_COLLECTION", 4, sending_event);
				case "item":
					return mod.toClient("S_SPAWN_DROPITEM", 8, sending_event);
				case "build_object":
					return mod.toClient("S_SPAWN_BUILD_OBJECT", 2, sending_event);
			}
		}
		// Ignore if streamer mode is enabled
		if (mod.settings.stream) return;
		// Ignore if spawnObject is disabled
		if (!mod.settings.spawnObject) return;
		if (!guide.spawnObject) return;
		// Check ent argument is defined
		if (!ent) return mod.error("Spawn handler has invalid entity or not specified");
		// Make sure id is defined
		if (!event["id"]) return mod.error("Spawn handler needs a id");
		// Make sure sub_delay is defined
		if (!event["sub_delay"]) return mod.error("Spawn handler needs a sub_delay");
		// Make sure distance is defined
		//if(!event["distance"]) return mod.error("Spawn handler needs a distance");
		// Set sub_type to be collection as default for backward compatibility
		const sub_type = event["sub_type"] || "collection";
		// The unique spawned id this item will be using.
		const item_unique_id = event["force_gameId"] || uint64--;
		// The location of the item spawned
		let loc = ent["loc"].clone();
		// if pos is set, we use that
		if (event["pos"]) loc = event["pos"];
		loc.w = (ent["loc"].w || 0) + (event["offset"] || 0);
		library.applyDistance(loc, event["distance"] || 0, event["degrees"] || 0);
		let sending_event = {
			gameId: item_unique_id,
			loc: loc,
			w: loc.w
		};
		// Create the sending event
		switch (sub_type) {
			// If it"s type collection, it"s S_SPAWN_COLLECTION
			case "collection":
				Object.assign(sending_event, {
					id: event["id"],
					amount: 1,
					extractor: false,
					extractorDisabled: false,
					extractorDisabledTime: 0
				});
				break;
			// If it"s type item, it"s S_SPAWN_DROPITEM
			case "item":
				Object.assign(sending_event, {
					item: event["id"],
					amount: 1,
					expiry: 0,
					explode: false,
					masterwork: false,
					enchant: 0,
					debug: false,
					owners: []
				});
				break;
			// If it's type build_object, it's S_SPAWN_BUILD_OBJECT
			case "build_object":
				Object.assign(sending_event, {
					itemId: event["id"],
					unk: 0,
					ownerName: event["ownerName"] || "",
					message: event["message"] || ""
				});
				break;
			// If we haven't implemented the sub_type the event asks for
			default:
				return mod.error(`Invalid sub_type for spawn handler: ${event['sub_type']}`);
		}
		// Create timer for specified delay
		const delay = parseInt(event["delay"]);
		if (delay > 0) {
			mod.setTimeout(callback, delay / speed, sub_type, sending_event);
		} else {
			callback(sub_type, sending_event);
		}
		const despawn_event = {
			gameId: item_unique_id,
			unk: 0, // used in S_DESPAWN_BUILD_OBJECT
			collected: false // used in S_DESPAWN_COLLECTION
		};
		// Create timer for despawn a spawned object
		mod.setTimeout(() => {
			switch (sub_type) {
				case "collection":
					mod.toClient("S_DESPAWN_COLLECTION", 2, despawn_event);
					break;
				case "item":
					mod.toClient("S_DESPAWN_DROPITEM", 4, despawn_event);
					break;
				case "build_object":
					mod.toClient("S_DESPAWN_BUILD_OBJECT", 2, despawn_event);
					break;
			}
		}, parseInt(event["sub_delay"]) / speed);
	}

	// Despawn handler for objects, spawned by "force_gameId"
	function despawnHandler(event) {
		// Make sure id is defined
		if (!event['id']) return mod.error("Spawn handler needs a id");
		// Set sub_type to be collection as default for backward compatibility
		const sub_type = event["sub_type"] || "collection";
		const despawn_event = {
			gameId: event["id"],
			unk: 0, // used in S_DESPAWN_BUILD_OBJECT
			collected: false // used in S_DESPAWN_COLLECTION
		};
		switch (sub_type) {
			case "collection":
				return mod.toClient("S_DESPAWN_COLLECTION", 2, despawn_event);
			case "item":
				return mod.toClient("S_DESPAWN_DROPITEM", 4, despawn_event);
			case "build_object":
				return mod.toClient("S_DESPAWN_BUILD_OBJECT", 2, despawn_event);
			default:
				return mod.error(`Invalid sub_type for despawn handler: ${event["sub_type"]}`);
		}
	}

	// Text handler
	function textHandler(event, ent, speed = 1.0) {
		// Callback function
		const callback = (sub_type, message) => {
			switch (sub_type) {
				// Basic message
				case "message":
					sendMessage(message);
					break;
				// Alert message red
				case "alert":
					sendAlert(message, cr, spr);
					break;
				// Alert message blue
				case "warning":
					sendAlert(message, clb, spb);
					break;
				// Notification message
				case "notification":
					sendNotification(message);
					break;
				// Pink dungeon event message
				case "msgcp":
					sendDungeonEvent(message, cp, spg);
					break;
				// Green dungeon event message
				case "msgcg":
					sendDungeonEvent(message, cg, spg);
					break;
				// Debug or test message to the proxy-channel and log console
				case "MSG":
					command.message(cr + message);
					console.log(cr + message);
					break;
				// Color-specified proxy-channel messages
				case "COMSG":
					command.message(co + message);
					break;
				case "CYMSG":
					command.message(cy + message);
					break;
				case "CGMSG":
					command.message(cg + message);
					break;
				case "CDBMSG":
					command.message(cdb + message);
					break;
				case "CBMSG":
					command.message(cb + message);
					break;
				case "CVMSG":
					command.message(cv + message);
					break;
				case "CPMSG":
					command.message(cp + message);
					break;
				case "CLPMSG":
					command.message(clp + message);
					break;
				case "CLBMSG":
					command.message(clb + message);
					break;
				case "CBLMSG":
					command.message(cbl + message);
					break;
				case "CGRMSG":
					command.message(cgr + message);
					break;
				case "CWMSG":
					command.message(cw + message);
					break;
				case "CRMSG":
					command.message(cr + message);
					break;
				// Default color proxy-channel message
				case "PRMSG":
					command.message(mod.settings.cc + message);
					break;
				// Invalid sub_type value
				default:
					return mod.error(`Invalid sub_type for text handler: ${event['sub_type']}`);
			}
		}
		// Fetch the message
		const message = event[`message_${uclanguage}`] || event[`message_${language}`] || event["message"];
		// Make sure sub_type is defined
		if (!event["sub_type"]) return mod.error("Text handler needs a sub_type");
		// Make sure message is defined
		if (!message) return mod.error("Text handler needs a message");
		// Play the voice for specified types
		if (["message", "alert", "warning", "notification", "msgcp", "msgcg", "speech"].includes(event["sub_type"])) {
			// Ignoring if verbose mode is disabled
			if (!guide.verbose) return;
			// Play the voice of text message
			if (voice && mod.settings.speaks) {
				voice.speak(message, mod.settings.rate);
			}
			// Ignoring sending a text message if "speech" sub_type specified
			if (event["sub_type"] == "speech") return;
		}
		// Create timer for specified delay
		const delay = parseInt(event["delay"]);
		if (delay > 0) {
			mod.setTimeout(callback, delay / speed, event["sub_type"], message);
		} else {
			callback(event["sub_type"], message);
		}
	}

	// Func handler
	function funcHandler(event, ent, speed = 1.0) {
		// Callback function
		const callback = (event) => {
			try {
				// Try to call the function
				try {
					event["func"](...event["args"], eventHandlers, event, ent, dispatch);
				// Old style call
				} catch (e) {
					event["func"].call(null, eventHandlers, event, ent, dispatch);
				}
			} catch (e) {
				mod.error(e);
			}
		}
		// Make sure func is defined
		if (!event["func"]) return mod.error("Func handler needs a func");
		// Create timer for specified delay
		const delay = parseInt(event["delay"]);
		if (delay > 0) {
			mod.setTimeout(callback, delay / speed, event);
		} else {
			callback(event);
		}
	}

	// Spawn Func handler
	function spawnFuncHandler(event, ent, speed = 1.0) {
		// Ignore if streamer mode is enabled
		if (mod.settings.stream) return;
		// Ignore if spawnObject is disabled
		if (!mod.settings.spawnObject) return;
		if (!guide.spawnObject) return;
		// Check ent argument is defined
		if (!ent) return mod.error("Spawn Func handler has invalid entity or not specified");
		// Make sure func and args is defined
		if (!event["func"]) return mod.error("Spawn Func handler needs a func");
		if (!event["args"]) return mod.error("Spawn Func handler needs a args");
		// Create a Spawn class
		const { Spawn } = lib;
		const spawn = new Spawn(eventHandlers, event, ent, dispatch);
		try {
			// Create timer for specified delay
			const delay = parseInt(event["delay"]);
			if (delay > 0) {
				mod.setTimeout(() => {
					spawn[event["func"]](...event["args"]);
				}, delay / speed);
			} else {
				spawn[event["func"]](...event["args"]);
			}
		} catch (e) {
			mod.error(e);
		}
	}


	/** HELPER FUNCTIONS **/

	// Load guide script
	function loadZoneHandler(zone, debug_enabled) {
		// Clear old data and set guide as not loaded
		guide.object = {};
		guide.mobshp = {};
		guide.loaded = false;
		// Clear out the timers
		mod.clearAllTimeouts();
		mod.clearAllIntervals();
		// Clear out previous hooks, that our previous guide module hooked
		dispatch._remove_all_hooks();
		// Send debug message
		sendDebug(debug.all || debug_enabled, `Entered zone: ${zone}`);
		// Check guide and attach settings from config
		if (zone == "test") { // load test guide data
			guide.id = zone;
			guide.name = "Test Guide";
			Object.assign(guide, defaultSettings);
		} else if (mod.settings.dungeons[zone]) {
			guide.id = parseInt(zone);
			Object.assign(guide, mod.settings.dungeons[zone]);
		} else {
			sendDebug(debug_enabled, `Zone "${zone}" is not found`);
			return; // returns if zone not found
		}
		// Set dungeon zone type for loaded guide
		if (SP_ZONE_IDS.includes(guide.id)) {
			guide.sp = true; // skill 1000-3000
			guide.es = false;
		} else if (ES_ZONE_IDS.includes(guide.id)) {
			guide.sp = false; // skill 100-200-3000
			guide.es = true;
		} else {
			guide.sp = false; // skill 100-200 
			guide.es = false;
		}
		// Remove potential cached guide from require cache, so that we don"t need to relog to refresh guide
		try {
			delete require.cache[require.resolve(`${GUIDES_DIR}/${guide.id}`)];
		} catch (e) {}
		// Load guide script
		try {
			// Old style guides loading
			guide.object = require(`${GUIDES_DIR}/${guide.id}`);
			guide.object.load(dispatch);
		} catch (e) {
			try {
				guide.object = require(`${GUIDES_DIR}/${guide.id}`)(dispatch, guide);
			} catch (e) {
				return mod.error(e);
			}
		}
		// Send welcome message
		if (guide.sp) {
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.enteresdg}: ${cr}${guide.name} ${cw}[${guide.id}]`
			});
		} else if (guide.es) {
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.enterspdg}: ${cr}${guide.name} ${cw}[${guide.id}]`
			});
		} else {
			textHandler({
				"sub_type": "PRMSG",
				"message": `${lang.enterdg}: ${cr}${guide.name} ${cw}[${guide.id}]`
			});
		}
		textHandler({
			"sub_type": "CGMSG",
			"message": `${lang.helpheader}\n` +
				`${lang.stream}: ${mod.settings.stream ? lang.enabled : lang.disabled}\n` +
				`${lang.gNotice}: ${mod.settings.gNotice ? lang.enabled : lang.disabled}\n` +
				`${lang.speaks}: ${mod.settings.speaks ? lang.enabled : lang.disabled}`
		});
		// Set guide as loaded
		guide.loaded = true;
	}

	// Create the configuration for all available guides
	async function initConfiguration() {
		// Load the ids of the available guides
		const guideFiles = await readdir(path.resolve(__dirname, GUIDES_DIR));
		for (const file of guideFiles) {
			if (!file.endsWith(".js")) continue;
			const zoneId = file.split(".")[0];
			if (!mod.settings.dungeons[zoneId])
				mod.settings.dungeons[zoneId] = Object.assign({ name: undefined }, defaultSettings);
			// We can however apply these names
			if(zoneId === "3020") {
				let s = {
					en: "Sea of Honor",
					kr: "금비늘호",
					jp: "探宝の金鱗号",
					de: "Goldschuppe",
					fr: "l'Écaille dorée",
					tw: "金麟號",
					ru: "Золотая чешуя"
				};
				mod.settings.dungeons[zoneId].name = s[language] || s["en"];
			}
		}
		// Grab a list of dungeon names, and apply them to settings
		let allDungeons;
		const dungeons = new Map();
		try {
			const resOne = await mod.queryData("/EventMatching/EventGroup/Event@type=?", ["Dungeon"], true, true, ["id"]);
			allDungeons = resOne.map(e => {
				const zoneId = e.children.find(x => x.name == "TargetList").children.find(x => x.name == "Target").attributes.id;
				let dungeon = dungeons.get(zoneId);
				if (!dungeon){
					dungeon = { id: zoneId, name: "" };
					dungeons.set(zoneId, dungeon);
				}
				return dungeon;
			});
			const resTwo = await mod.queryData("/StrSheet_Dungeon/String@id=?", [[... dungeons.keys()]], true);
			for (const res of resTwo){
				const id = res.attributes.id.toString();
				const name = res.attributes.string.toString();
				if (!mod.settings.dungeons[id]) continue;
				mod.settings.dungeons[id].name = name;
			}
		} catch (e) {
			mod.warn(e);
			// Try to read dungeon list from "guides" directory, as dungeon name uses first line of guide js file
			const guideFiles = await readdir(path.resolve(__dirname, GUIDES_DIR));
			for (const file of guideFiles) {
				if (!file.endsWith(".js")) continue;
				const zoneId = file.split(".")[0];
				if (!mod.settings.dungeons[zoneId]) continue;
				let lineReader = readline.createInterface({
					input: fs.createReadStream(path.join(__dirname, GUIDES_DIR, file))
				});
				lineReader.on("line", function (line) {
					const name = line.replace(/^[\/\s]+/g, "") || zoneId;
					mod.settings.dungeons[zoneId].name = name;
					lineReader.close();
					lineReader.removeAllListeners();
				});
			}
		}
	};

	// Makes sure the event passes the class position check
	function classPositionCheck(class_position) {
		// if it's not defined we assume that it's for everyone
		if (!class_position) return true;
		// If it's an array
		if (Array.isArray(class_position)) {
			// If one of the class_positions pass, we can accept it
			for (let ent of class_position) {
				if (classPositionCheck(ent)) return true;
			}
			// All class_positions failed, so we return false
			return false;
		}
		switch (class_position) {
			case "tank":
				// if it's a warrior with dstance abnormality
				if (player.job === 0) {
					// Loop thru tank abnormalities
					for (let id of WARRIOR_TANK_IDS) {
						// if we have the tank abnormality return true
						if (effect.hasAbnormality(id)) return true;
					}
				}
				// if it's a tank return true
				if (TANK_CLASS_IDS.includes(player.job)) return true;
				break;
			case "dps":
				// If it's a warrior with dstance abnormality
				if (player.job === 0) {
					// Loop thru tank abnormalities
					for (let id of WARRIOR_TANK_IDS) {
						// if we have the tank abnormality return false
						if (effect.hasAbnormality(id)) return false;
					}
					// warrior didn't have tank abnormality
					return true;
				}
				// if it's a dps return true
				if (DPS_CLASS_IDS.includes(player.job)) return true;
				break;
			case "heal":
				// if it's a healer return true
				if (HEALER_CLASS_IDS.includes(player.job)) return true;
				break;
			case "priest":
				if (player.job === 6) return true; // For Priest specific actions (eg Arise)
				break;
			case "mystic":
				if (player.job === 7) return true; // For Mystic specific actions
				break;
			case "lancer":
				if (player.job === 1) return true; // For Lancer specific actions (eg Blue Shield)
				break;
			default:
				mod.warn(`Failed to find class position: ${position}`);
		}
		return false;
	}

	// This is where all the magic happens
	function startEvents(events = [], ent, speed = 1.0) {
		// Loop over the events
		for (let event of events) {
			const func = eventHandlers[event["type"]];
			// The function couldn"t be found, so it"s an invalid type
			if (!func)
				mod.error(`An event has invalid type: ${event["type"]}`);
			// If the function is found and it passes the class position check, we start the event
			else if (classPositionCheck(event["class_position"]))
				func(event, ent);
		}
	}

	// Handle events such as boss skill and abnormalities triggered
	function handleEvent(ent, id, called_from_identifier, prefix_identifier, debug_enabled, speed = 1.0, stage = false) {
		const unique_id = `${prefix_identifier}-${ent["huntingZoneId"]}-${ent["templateId"]}`;
		const key = `${unique_id}-${id}`;
		const stage_string = (stage === false ? '' : `-${stage}`);
		const entry = (stage !== false) ? guide.object[key + stage_string] : guide.object[key];
		sendDebug(debug_enabled, `${called_from_identifier}: ${id} | Started by: ${unique_id} | key: ${key + stage_string}`);
		if (entry) startEvents(entry, ent, speed);
	}

	// When the mod gets unloaded, clear all the timers & remove the chat command
	this.destructor = async () => {
		mod.clearAllTimeouts();
		mod.clearAllIntervals();
		command.remove("guide");
		guide = {};
	};
}

Object.assign(module.exports, { lib });