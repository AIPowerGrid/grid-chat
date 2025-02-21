const aestheticTextStyleTypes = ['text', 'speech', 'action'];	 // One style per speech type. Could add more later I guess.
	const aestheticTextStyleRoles = ['uniform', 'you', 'AI', 'sys']; // Uniform for when you want all roles use the same styles.

	class AestheticInstructUISettings {
		constructor() {
			this.bubbleColor_sys = 'rgb(18, 36, 36)';
			this.bubbleColor_you = 'rgb(41, 52, 58)';
			this.bubbleColor_AI = 'rgb(20, 20, 40)';

			this.background_margin = [5, 5, 5, 0];
			this.background_padding = [15, 15, 10, 5];
			this.background_minHeight = 80;
			this.centerHorizontally = false;

			this.border_style = 'Rounded';
			this.portrait_width_AI = 80;
			this.portrait_ratio_AI = 1.0;
			this.portrait_width_you = 80;
			this.portrait_ratio_you = 1.0;

			this.show_chat_names = true;
			this.rounded_bubbles = true;
			this.match_background = false;

			this.you_portrait = null;
			this.AI_portrait = "default";

			this.font_size = 12;
			this.use_markdown = true;
			this.use_uniform_colors = true; // Hides 'you, AI, sys' if set to true via settings UI.

			for (let role of aestheticTextStyleRoles) {
				this[`text_tcolor_${role}`] = 'rgb(255, 255, 255)';
				this[`speech_tcolor_${role}`] = 'rgb(150, 150, 200)';
				this[`action_tcolor_${role}`] = 'rgb(178, 178, 178)';
			}

			this.code_block_background = 'rgb(0, 0, 0)';
			this.code_block_foreground = 'rgb(180, 35, 40)';
		}

		padding() { return `${this.background_padding[2]}px ${this.background_padding[1]}px ${this.background_padding[3]}px ${this.background_padding[0]}px`; }
		margin() { return `${this.background_margin[2]}px ${this.background_margin[1]}px ${this.background_margin[3]}px ${this.background_margin[0]}px`; }
		portraitSize(role) {
			if (role == "you") {
				return { width: this.portrait_width_you, height: this.border_style == 'Circle' ? this.portrait_width_you : this.portrait_width_you / this.portrait_ratio_you };
			} else {
				return { width: this.portrait_width_AI, height: this.border_style == 'Circle' ? this.portrait_width_AI : this.portrait_width_AI / this.portrait_ratio_AI };
			}
		}
		portraitRadius() { return this.border_style == 'Circle' ? '1000rem' : (this.border_style == 'Rounded' ? '1.6rem' : '0.1rem'); }
	}

	const sideMapping = { 'left': 0, 'right': 1, 'top': 2, 'bottom': 3 };

	let aestheticInstructUISettings = new AestheticInstructUISettings();
	let tempAestheticInstructUISettings = null; // These exist to act as backup when customizing, to revert when pressing the 'Cancel' button.

	function selectAvatarImage(isSelfPortrait)
	{
		let finput = document.getElementById('portraitFileInput');
		finput.click();
		finput.onchange = (event) => {
			if (event.target.files.length > 0 && event.target.files[0]) {
				const file = event.target.files[0];
				const reader = new FileReader();
				reader.onload = function(img) {
					compressImage(img.target.result, loadCompressedImage, true, true, AVATAR_PX);
					function loadCompressedImage(compressedImageURI, aspectratio) {

						if(isSelfPortrait)
						{
							aestheticInstructUISettings.you_portrait = compressedImageURI;
							document.getElementById('portrait_ratio_you').value = aspectratio.toFixed(2);
						}
						else
						{
							aestheticInstructUISettings.AI_portrait = compressedImageURI;
							document.getElementById('portrait_ratio_AI').value = aspectratio.toFixed(2);
						}
						refreshAestheticPreview(true);
					}
				}
				reader.readAsDataURL(file);
			}
			finput.value = "";
		};
	}

	function initializeInstructUIFunctionality() {

		// Initialize foregroundColorPickers and backgroundColorPickers.
		document.querySelectorAll('.enhancedcolorPicker, .enhancedStandardColorPicker').forEach(element => {
			// Create a fully transparent colorPicker for each element and initialize it as child of the textblock element.
			// ..this happens because we want the colorPicker to open right below the element.
			let useBackground = !element.classList.contains('enhancedcolorPicker');
			let colorPicker = document.createElement('input');
			colorPicker.type = 'color';
			colorPicker.style.opacity = '0';
			colorPicker.style.position = 'absolute';
			colorPicker.style.width = '100%';
			colorPicker.style.height = '100%';
			colorPicker.classList.add("colorpickerchild");
			colorPicker.value = element.style[`${useBackground ? 'backgroundColor' : 'color'}`];
			element.style.position = 'relative';
			element.appendChild(colorPicker);

			// If we're on Safari browser and in iOS, we need some adjustments for the colorpickers to work.
			// ..this happens because the clicks need to be directly done on the colorPicker for iOS in Safari.
			if (/^((?!Chrome|Firefox).)*Safari/i.test(navigator.userAgent) && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
				// Create a wrapper for the existing content. This will fix the offset slightly.
				let contentWrapper = document.createElement('div');
				contentWrapper.style.position = 'relative';
				contentWrapper.style.zIndex = '0';
				element.appendChild(contentWrapper);

				// Finally, make the colorPicker directly clickable, and offset it slightly towards the text block.
				colorPicker.style.zIndex = '1';
				colorPicker.style.margin = '-20px';
			}
			else {
				colorPicker.style.zIndex = '-1';
				element.addEventListener('click', () => colorPicker.click());
			}

			// Initialize the functionalities of the colorPicker
			colorPicker.addEventListener('change', function() {
				element.style[`${useBackground ? 'backgroundColor' : 'color'}`] = this.value;
				refreshAestheticPreview();
			});
			element.addEventListener('mouseover', () => element.style.cursor = "pointer");
		});

		// Initialize functionality for the margin & padding input fields.
		document.querySelectorAll('.instruct-settings-input').forEach(element => {
			const input = element.querySelector('input');
			const type = element.getAttribute('data-type');
			const side = element.getAttribute('data-side');

			input.addEventListener('input', function() {
				let clippedvalue = parseInt(this.value, 10);
				clippedvalue = cleannum(clippedvalue, 0, 300);
				if (type === 'margin') { aestheticInstructUISettings.background_margin[sideMapping[side]] = parseInt(clippedvalue, 10); }
				else if (type === 'padding') { aestheticInstructUISettings.background_padding[sideMapping[side]] = parseInt(clippedvalue, 10); }
			});
		});

		// Initialize functionality for the portrait pickers.
		document.querySelectorAll('#you-portrait, #AI-portrait').forEach(element => {
		element.addEventListener('click', (e) => {
			selectAvatarImage(element.id=="you-portrait");
		});
		element.addEventListener('mouseover', () => element.style.cursor = "pointer");
		});

		document.getElementById("reset-portrait").addEventListener('click', (e) => {
			aestheticInstructUISettings.you_portrait = null;
			aestheticInstructUISettings.AI_portrait = "default";
			document.getElementById('portrait_ratio_AI').value = 1.0;
			document.getElementById('portrait_width_AI').value = 100;
			document.getElementById('portrait_ratio_you').value = 1.0;
			document.getElementById('portrait_width_you').value = 100;
			refreshAestheticPreview(true);
		});

		document.getElementById("reset-all-aesthetic-instruct").addEventListener('click', (e) => {

			let ns = new AestheticInstructUISettings();
			aestheticInstructUISettings = deepCopyAestheticSettings(ns);
			refreshAestheticPreview(false);
		});

		refreshAestheticPreview(false);
	}

	function openAestheticUISettingsMenu() {
		tempAestheticInstructUISettings = deepCopyAestheticSettings(aestheticInstructUISettings);
		document.getElementById("aestheticsettingscontainer").classList.remove("hidden");
		updateTextPreview();

	}
	function hideAestheticUISettingsMenu(confirm) {
		if (!confirm) { aestheticInstructUISettings = deepCopyAestheticSettings(tempAestheticInstructUISettings); updateUIFromData(); }
		tempAestheticInstructUISettings = null;

		document.getElementById("aestheticsettingscontainer").classList.add("hidden");
		render_gametext();
	}

	function deepCopyAestheticSettings(original) {
		let copy = new AestheticInstructUISettings();
		for (let [key, value] of Object.entries(original)) {
			copy[key] = value;
		}
		return copy;
	}

	function refreshAestheticPreview(updateFromUI = true) {
		if (updateFromUI) { updateDataFromUI(); }
		updateUIFromData();
		updateTextPreview();
		character_creator_updateimg();
	}

	function updateDataFromUI() {
		for (let role of aestheticTextStyleRoles) {
			for (let type of aestheticTextStyleTypes) {
				aestheticInstructUISettings[`${type}_tcolor_${role}`] = getColorPickerValueFromElement(`${role}-${type}-colorselector`);
			}
			if (role != 'uniform') { aestheticInstructUISettings[`bubbleColor_${role}`] = document.getElementById(`${role}-bubble-colorselector`).style.backgroundColor; }
		}
		aestheticInstructUISettings.code_block_background = document.getElementById('code-block-background-colorselector').style.color;
		aestheticInstructUISettings.code_block_foreground = document.getElementById('code-block-foreground-colorselector').style.color;

		aestheticInstructUISettings.match_background = document.getElementById('aui_match_background').checked;
		aestheticInstructUISettings.rounded_bubbles = document.getElementById('aui_rounded_bubbles').checked;
		aestheticInstructUISettings.show_chat_names = document.getElementById('aui_show_chat_names').checked;
		aestheticInstructUISettings.use_markdown = document.getElementById('instructModeMarkdown').checked;
		aestheticInstructUISettings.use_uniform_colors = !document.getElementById('instructModeCustomized').checked;
		aestheticInstructUISettings.font_size = document.getElementById('instruct-font-size').value;
		aestheticInstructUISettings.border_style = document.getElementById('instructBorderStyle').value;
		aestheticInstructUISettings.portrait_width_AI = document.getElementById('portrait_width_AI').value;
		aestheticInstructUISettings.portrait_ratio_AI = document.getElementById('portrait_ratio_AI').value;
		aestheticInstructUISettings.portrait_width_you = document.getElementById('portrait_width_you').value;
		aestheticInstructUISettings.portrait_ratio_you = document.getElementById('portrait_ratio_you').value;
		aestheticInstructUISettings.background_minHeight = document.getElementById('instruct-min-backgroundHeight').value;
		aestheticInstructUISettings.centerHorizontally = document.getElementById('instructModeCenterHorizontally').checked;

		//basic sanitization
		aestheticInstructUISettings.font_size = cleannum(aestheticInstructUISettings.font_size, 5, 50);
		aestheticInstructUISettings.portrait_width_AI = cleannum(aestheticInstructUISettings.portrait_width_AI, 10, 250);
		aestheticInstructUISettings.portrait_ratio_AI = cleannum(aestheticInstructUISettings.portrait_ratio_AI, 0.01, 3).toFixed(2);
		aestheticInstructUISettings.portrait_width_you = cleannum(aestheticInstructUISettings.portrait_width_you, 10, 250);
		aestheticInstructUISettings.portrait_ratio_you = cleannum(aestheticInstructUISettings.portrait_ratio_you, 0.01, 3).toFixed(2);
		aestheticInstructUISettings.background_minHeight = cleannum(aestheticInstructUISettings.background_minHeight, 0, 300);

		function getColorPickerValueFromElement(id) {
			let element = document.getElementById(id);
			let computedStyle = window.getComputedStyle(element);
			return computedStyle.color;
		}
	}
	function updateUIFromData() {
		// Parse color settings and apply to the related parts in the UI.
		for (let role of aestheticTextStyleRoles) {
			for (let type of aestheticTextStyleTypes) {
				setElementColor(`${role}-${type}-colorselector`, aestheticInstructUISettings[`${type}_tcolor_${role}`], false);
			}
			if (role != 'uniform') {
				setElementColor(`${role}-bubble-colorselector`, aestheticInstructUISettings[`bubbleColor_${role}`], true);
			}
		}

		setElementColor('code-block-background-colorselector', aestheticInstructUISettings.code_block_background, false);
		setElementColor('code-block-foreground-colorselector', aestheticInstructUISettings.code_block_foreground, false);

		// Apply the settings from the json file to the UI.
		document.getElementById('aui_match_background').checked = aestheticInstructUISettings.match_background;
		document.getElementById('aui_rounded_bubbles').checked = aestheticInstructUISettings.rounded_bubbles;
		document.getElementById('aui_show_chat_names').checked = aestheticInstructUISettings.show_chat_names;
		document.getElementById('instructModeMarkdown').checked = aestheticInstructUISettings.use_markdown;
		document.getElementById('instructModeCustomized').checked = !aestheticInstructUISettings.use_uniform_colors;
		document.getElementById('instruct-font-size').value = aestheticInstructUISettings.font_size;
		document.getElementById('instructBorderStyle').value = aestheticInstructUISettings.border_style;
		document.getElementById('portrait_width_AI').value = aestheticInstructUISettings.portrait_width_AI;
		document.getElementById('portrait_ratio_AI').value = aestheticInstructUISettings.portrait_ratio_AI;
		document.getElementById('portrait_width_you').value = aestheticInstructUISettings.portrait_width_you;
		document.getElementById('portrait_ratio_you').value = aestheticInstructUISettings.portrait_ratio_you;
		document.getElementById('instruct-min-backgroundHeight').value = aestheticInstructUISettings.background_minHeight;
		document.getElementById('instructModeCenterHorizontally').checked = aestheticInstructUISettings.centerHorizontally;

		// Show or hide customization UI elements based on whether they should be visible in the UI or not.
		showOrHide('.uniform-mode-font', document.getElementById('instructModeCustomized').checked == false);
		showOrHide('.custom-mode-font', document.getElementById('instructModeCustomized').checked == true);
		showOrHide('.instruct-markdown-user', document.getElementById('instructModeMarkdown').checked == true);
		showOrHide('.rectPortraitMode', document.getElementById('instructBorderStyle').value != 'Circle');

		document.querySelectorAll('.instruct-settings-input').forEach(element => {
			const input = element.querySelector('input');
			const type = element.getAttribute('data-type');
			const side = element.getAttribute('data-side');

			if (type === 'margin') { input.value = aestheticInstructUISettings.background_margin[sideMapping[side]]; }
			else if (type === 'padding') { input.value = aestheticInstructUISettings.background_padding[sideMapping[side]]; }
		});


		function setElementColor(id, newColor, isBackground) {
			let element = document.getElementById(id);
			if (!element) { console.warn(`Element with ID: ${id} not found.`); return; }

			if (isBackground) {
				element.style.backgroundColor = newColor;
			}
			else {
				element.style.color = newColor;
			}

			var childInput = element.querySelector('.colorpickerchild');
			if (childInput && newColor.includes("rgb")) {
				childInput.value = rgb_to_hex(newColor);
			} else {
				childInput.value = newColor;
			}
		}
		function showOrHide(classID, value) {
			if (value) { document.querySelectorAll(classID).forEach((x) => x.classList.remove('hidden')); }
			else { document.querySelectorAll(classID).forEach((x) => x.classList.add('hidden')); }
		}
	}

	function render_aesthetic_ui(input, isPreview) //class suffix string used to prevent defined styles from leaking into global scope
	{
		if(localsettings.separate_end_tags) {
			if (get_instruct_starttag_end(true)) {
				input = replaceAll(input, get_instruct_starttag_end(true), "");
			}
			if (get_instruct_endtag_end(true)) {
				input = replaceAll(input, get_instruct_endtag_end(true), "");
			}
			if (get_instruct_systag_end(true)) {
				input = replaceAll(input, get_instruct_systag_end(true), "");
			}
		}

		if(!isPreview)
		{
			if(aestheticInstructUISettings.match_background)
			{
				document.getElementById('enhancedchatinterface_inner').style.backgroundColor = aestheticInstructUISettings.bubbleColor_sys;
			}else
			{
				document.getElementById('enhancedchatinterface_inner').style.backgroundColor = null;
			}
		}
		let as = aestheticInstructUISettings;
		let classSuffixStr = isPreview ? "prv" : "";
		let portraitsStyling = // Also, implement portraits as css classes. Now chat entries can reuse them instead of recreating them.
		`<style>
			.you-portrait-image`+classSuffixStr+` {margin: 10px 6px; background:url(`+ as.you_portrait +`); background-clip: content-box; background-position: 50% 50%; background-size: 100% 100%; background-origin: content-box; background-repeat: no-repeat; border:none;}
			.AI-portrait-image`+classSuffixStr+` {margin: 10px 6px; background:url(`+ (as.AI_portrait!="default"?as.AI_portrait:niko_square) +`); background-clip: content-box; background-position: 50% 50%; background-size: 100% 100%; background-origin: content-box; background-repeat: no-repeat; border:none;}
		</style>
		`;

		const contextDict = { sysOpen: '<sys_context_koboldlite_internal>', youOpen: '<user_context_koboldlite_internal>', AIOpen: '<AI_context_koboldlite_internal>', closeTag: '<end_of_context_koboldlite_internal>' }
		let you = "$UnusedTagMatch$"; let bot = "$UnusedTagMatch$"; // Instruct tags will be used to wrap text in styled bubbles.
		if(localsettings.opmode==3||localsettings.opmode==4)
		{
			you = get_instruct_starttag();
			bot = get_instruct_endtag();
		}

		if(localsettings.opmode==3)
		{
			if(!input.startsWith("\n"))
			{
				input = "\n"+input;
			}
			//replace all possible instances with placeholders
			var mynameregex = new RegExp("\n(" + localsettings.chatname + ")\: ", "gi");
			var mynameregex2 = new RegExp("(" + localsettings.chatname + ")\: ", "gi");
			var mynameregex3 = new RegExp("\n(" + localsettings.chatname + ") ", "gi");
			var othernamesregex = new RegExp("\n(?!" + localsettings.chatname + ").+?\: ", "gi");
			if(!localsettings.chat_match_any_name && localsettings.chatopponent!="")
			{
				let namelist = localsettings.chatopponent.split("||$||");
				var namePattern = namelist.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
				othernamesregex = new RegExp("(" + namePattern + "): ", "gi");
			}

			input = input.replaceAll(mynameregex, '{{userplaceholder}}');
			input = input.replaceAll(mynameregex2, '{{userplaceholder}}');
			input = input.replaceAll(mynameregex3, '{{userplaceholder}}');
			if(as.show_chat_names)
			{
				input = input.replaceAll("{{userplaceholder}}", `{{userplaceholder}}<p class='aui_nametag'>`+escape_html(localsettings.chatname)+`</p>`);
				input = input.replaceAll(othernamesregex, function(match) {
					//edge condition: if matched string already contains placeholders, something went wrong. return original string
					if(match.includes("{{userplaceholder}}"))
					{
						return match;
					}
					return "{{botplaceholder}}<p class='aui_nametag'>" + escape_html(match.substring(0,match.length-2).trim()) + "</p>";
				});
			}
			else
			{
				input = input.replaceAll(othernamesregex, function(match) {
					//edge condition: if matched string already contains placeholders, something went wrong. return original string
					if(match.includes("{{userplaceholder}}"))
					{
						return match;
					}
					return "{{botplaceholder}}";
				});
			}

			you = "{{userplaceholder}}";
			bot = "{{botplaceholder}}";
		}
		if(localsettings.opmode==4 && localsettings.inject_chatnames_instruct && localsettings.chatname!="" && localsettings.chatopponent!="")
		{
			let m_name = localsettings.chatname + ": ";
			input = replaceAll(input, m_name, `<p class='aui_nametag'>` + escape_html(localsettings.chatname) + `</p>`);

			let m_opps = localsettings.chatopponent.split("||$||");
			for(let i=0;i<m_opps.length;++i)
			{
				if(m_opps[i] && m_opps[i].trim()!="")
				{
					let m_opp = m_opps[i] + ": ";
					input = replaceAll(input, m_opp, `<p class='aui_nametag'>` + escape_html(m_opps[i]) + `</p>`);
				}
			}
		}


		// We'll transform the input to a well-formatted HTML string that'll contain the whole visuals for the Aesthetic Instruct Mode. Effectively we're styling the input.
		let noSystemPrompt = input.trim().startsWith(you.trim()) || input.trim().startsWith(bot.trim());
		let newbodystr = noSystemPrompt ? input : style('sys') + input;					 // First, create the string we'll transform. Style system bubble if we should.
		if (newbodystr.endsWith(bot)) { newbodystr = newbodystr.slice(0, -bot.length); } // Remove the last chat bubble if prompt ends with `end_sequence`.
		newbodystr = transformInputToAestheticStyle(newbodystr,isPreview); 						 // Transform input to aesthetic style, reduce any unnecessary spaces or newlines, and trim empty replies if they exist.
		if (synchro_pending_stream != "" && !isPreview) {
			newbodystr += getStreamingText();
		} 		 // Add the pending stream if it's needed. This will add any streamed text to a new bubble for the AI.
		else{
			let codeblockcount = (newbodystr.match(/```/g) || []).length;
			if(codeblockcount>0 && codeblockcount%2!=0 )
			{
				newbodystr += "```"; //force end code block
			}
		}
		newbodystr += contextDict.closeTag + '</p></div></div>';						 // Lastly, append the closing div so our body's raw form is completed.
		if (aestheticInstructUISettings.use_markdown) {

			let md = applyStylizedCodeBlocks(); 	// apply the code-block styling, if markdown is used.
			newbodystr = md[0];
			let codestashes = md[1];
			// If markdown is enabled, style the content of each bubble as well.
			let internalHTMLparts = []; // We'll cache the embedded HTML parts here to keep them intact.
			for (let role of aestheticTextStyleRoles) {																// ..starting by the "speech" and *actions* for each role.
				let styleRole = aestheticInstructUISettings.use_uniform_colors ? 'uniform' : role;					// Uniform role is preferred if it's active on the settings.
				newbodystr = newbodystr.replace(new RegExp(`${contextDict[`${role}Open`]}([^]*?)${contextDict.closeTag}`, 'g'), (match, captured) => {
					let replacedText = captured.replace(/<[^>]*>/g, (htmlPart) => { internalHTMLparts.push(htmlPart); return `<internal_html_${internalHTMLparts.length - 1}>`; });
					replacedText = replacedText.replace(bold_regex, wrapperSpan(styleRole, 'action')); 		// Apply the actions style to *actions*.
					replacedText = replacedText.replace(italics_regex, wrapperSpan(styleRole, 'action')); 		// Apply the actions style to *actions*.
					replacedText = replacedText.replace(/“(.*?)”/g, wrapperSpan(styleRole, 'speech')); 	// Apply the speech style to "speech".
					replacedText = replacedText.replace(/&quot;(.*?)&quot;/g, wrapperSpan(styleRole, 'speech')); 	// Apply the speech style to "speech".
					if(localsettings.instruct_has_markdown)
					{
						replacedText = simpleMarkdown(replacedText);
					}
					return `<span>${replacedText}</span>`;
				});
			}
			newbodystr = newbodystr.replace(/<internal_html_(.*?)>/gm, (match, p) => {
				return internalHTMLparts[p];
			});

			for(let i=0;i<codestashes.length;++i)
			{
				newbodystr = newbodystr.replace(`%CodeStash${i}%`,codestashes[i]);
			}
		}
		newbodystr = newbodystr.replace(/\[<\|p\|.+?\|p\|>\]/g, function (m) {
			// m here means the whole matched string
			let inner = m.substring(5, m.length - 5);
			inner = render_image_html("", inner,false,true);
			return inner;
		});
		newbodystr = newbodystr.replace(/\[<\|d\|.+?\|d\|>\]/g, function (m) {
			// m here means the whole matched string
			let inner = m.substring(5, m.length - 5);
			inner = render_image_html(inner, "",false,true);
			return inner;
		});
		return portraitsStyling + newbodystr.replaceAll(/(\r\n|\r|\n)/g,'<br>'); // Finally, convert newlines to HTML format and return the stylized string.


		// Helper functions to allow styling the chat log properly. These affect both the background of the chat bubbles and its content.
		function style(role) {
			let showavatar = false;
			if(localsettings.opmode==3 || localsettings.opmode==4)
			{
				showavatar = true;
			}
			return `${contextDict.closeTag}</div></div><div style='display:flex; align-items:stretch; flex-direction: row;'>${(showavatar?image(role):"")}<div style='flex: 1; display:flex; color: ${as[`text_tcolor_${as.use_uniform_colors ? 'uniform' : role}`]}; background-color:${as[`bubbleColor_${role}`]}; padding: ${as.padding()}; margin: ${as.margin()}; min-height:${as.background_minHeight}px; font-size: ${as.font_size}px; flex-direction:column; align-items: ${as.centerHorizontally ? 'center' : 'flex-start'}; justify-content: center; border-radius: ${as.rounded_bubbles ? '15px' : '0px'}'>${contextDict[`${role}Open`]}`;

		}
		function wrapperSpan(role, type) {
			let fontStyle = type=='action'?'italic':'normal';
			let injectQuotes1 = type=='speech'?'“':'';
			let injectQuotes2 = type=='speech'?'”':'';
			let textCol = as[`${type}_tcolor_${role}`];
			return `<span style='color: ${textCol}; font-style: ${fontStyle}; font-weight: normal'>${injectQuotes1}$1${injectQuotes2}</span>`;
		}
		function image(role) {
			if (!as[`${role}_portrait`] || as.border_style == 'None' || role == 'sys') { return ''; }
			let reinvertcolor = localsettings.invert_colors?" invert_colors":"";
			return `<div class='${role}-portrait-image${classSuffixStr}${reinvertcolor}' style='width:${as.portraitSize(role).width}px; height:${as.portraitSize(role).height}px; border-radius: ${as.portraitRadius()}'></div>`;
		}
		function applyStylizedCodeBlocks() {
			let blocks = newbodystr.split(/(```[\s\S]*?\n[\s\S]*?```)/g);
			let codestashes = [];
			for (var i = 0; i < blocks.length; i++) {
				if (blocks[i].startsWith('```')) {
					blocks[i] = blocks[i].replace(/```[\s\S]*?\n([\s\S]*?)```/g,
					function (m,m2) {
						let idx = codestashes.length;
						codestashes.push(`<pre style='min-width:80%;white-space:pre-wrap;margin:0px 30px 0px 20px;background-color:${as.code_block_background};color:${as.code_block_foreground}'>${m2.replace(/[“”]/g, "\"")}</pre>`);
						return `</p>%CodeStash${idx}%<p>`
					});
				}
				else {
					blocks[i] = blocks[i].replaceAll('```', '`').replaceAll('``', '`').replace(/`(.*?)`/g, function (m,m2) {return `<code style='background-color:black'>${m2.replace(/[“”]/g, "\"")}</code>`;}); //remove fancy quotes too
				}
			}
			return [blocks.join(''),codestashes];
		}
		function transformInputToAestheticStyle(bodyStr, isPreview) { // Trim unnecessary empty space and new lines, and append * or " to each bubble if start/end sequence ends with * or ", to preserve styling.
			bodyStr = bodyStr.replaceAll(you + '\n', you).replaceAll(you + ' ', you).replaceAll(you, style('you') + `${you.endsWith('*') ? '*' : ''}` + `${you.endsWith('"') ? '"' : ''}`);
			bodyStr = bodyStr.replaceAll(bot + '\n', bot).replaceAll(bot + ' ', bot).replaceAll(bot, style('AI') + `${bot.endsWith('*') ? '*' : ''}` + `${bot.endsWith('"') ? '"' : ''}`);

			//for adventure mode, highlight our actions with blockquotes
			if (localsettings.opmode == 2) {
				bodyStr = bodyStr.replace(/\n\n\> .+?\n/g, function (m) {
					let inner = m.substring(3);
					return `\n\n<blockquote>` + inner + `</blockquote>`;
				});
			}

			return bodyStr;

		}
		function getStreamingText() {
			let isChatBotReply = (localsettings.opmode==3 && pending_context_preinjection.startsWith("\n") && pending_context_preinjection.endsWith(":"));
			return `${(input.endsWith(bot) || isChatBotReply) ? style('AI') + `${bot.endsWith('*') ? '*' : ''}` + `${bot.endsWith('"') ? '"' : ''}` : ''}` + `<span class='pending_text'>`+ escape_html(pending_context_preinjection) + escape_html(synchro_pending_stream) + `</span`;
		}
	}

	function updateTextPreview() {
		let preview = `You are Mikago, a prestigious bot that's a supervillain.\n\nRoleplay in first person, be prestigious, don't be a bot. This is a fantasy world.\n\nCode blocks should be wrapped in triple backticks, like so:\n\`\`\`\n<Some_\n-- multiline\n--- code here$\n\`\`\`\n[AI_REPLY]\n*takes my hat off to greet the squad* "Greetings, I am Mikago, the prestigious!" *bows to the crew*\n*clears my throat* "Now, I'm sure there are many questions, but all will be answered in due time." *deep breath*\n[USER_REPLY]\n*draws my sword* "Yes. You should know the code to calculate the factorial of a number."\nThe crew also draws their weapons and point them at you, not giving you any space.\n[AI_REPLY]\n*backs off* "Woah, easy there.." *makes some steps backwards, but then stops*\n"I would normally take this as an insult to my prestige, but I understand your caution.." *takes a deep breath*\n"Well, if it's to prove myself, here goes the python code to calculate the factorial of a number.."\n\nMikago opens a live-code-portal with his magic and writes the code that was requested.\n\`\`\`\ndef factorial(n):\n  if n == 0:\n    return 1\n  else:\n    return n * factorial(n-1)\n\`\`\`\n*looks at you, getting impatient* "Are we ok now.. or do you want me to write the code of a game next?"\n[USER_REPLY]\n*sheathes my sword and approaches for a hug* "Oh, Mikago, my old friend, it is really you!"`;

		if(localsettings.opmode==3)
		{
			preview = replaceAll(preview,'\n[USER_REPLY]\n', "{{userplaceholder}}");
			if(aestheticInstructUISettings.show_chat_names){
				preview = replaceAll(preview,'\n[AI_REPLY]\n', "{{botplaceholder}}<p class='aui_nametag'>Bot</p>");
			}else{
				preview = replaceAll(preview,'\n[AI_REPLY]\n', "{{botplaceholder}}");
			}
		}
		else if(localsettings.opmode==4)
		{
			preview = replaceAll(preview,'\n[USER_REPLY]\n', get_instruct_starttag());
			preview = replaceAll(preview,'\n[AI_REPLY]\n', get_instruct_endtag());
		}
		else
		{
			preview = replaceAll(preview,'\n[USER_REPLY]\n', "");
			preview = replaceAll(preview,'\n[AI_REPLY]\n', "");
		}
		document.getElementById('aesthetic_text_preview').innerHTML = render_aesthetic_ui(preview,true);
	}

	function PerformWebsearch(webSearchQuery, onDone)
	{
		let proceedSearching = function() //called once search query is prepared
		{
			if(!websearch_multipass && (webSearchQuery==lastSearchQuery || webSearchQuery==""))
			{
				onDone(); //use cached results
			}
			else
			{
				if(pending_response_id=="")
				{
					pending_response_id = "-1";
					websearch_in_progress = true;
					render_gametext(false);
				}
				let murl = `${custom_kobold_endpoint}${koboldcpp_websearch_endpoint}`;
				murl = apply_proxy_url(murl);
				fetch(murl, {
					method: 'POST',
					headers: get_kobold_header(),
					body: JSON.stringify({q: webSearchQuery}),
				})
				.then(x => x.json())
				.then(values => {
					lastSearchQuery = webSearchQuery;
					lastSearchResults = values;
					if(pending_response_id=="-1")
					{
						pending_response_id = "";
					}
					websearch_in_progress = false;
					onDone();
				})
				.catch(error => {
					console.log("WebSearch Error: " + error);
					lastSearchResults = [];
					lastSearchQuery = "";
					if(pending_response_id=="-1")
					{
						pending_response_id = "";
					}
					websearch_in_progress = false;
					onDone();
				});
			}
		}

		//websearch
		if (websearch_enabled && is_using_kcpp_with_websearch())
		{
			webSearchQuery = webSearchQuery.trim();

			if(webSearchQuery=="")
			{
				webSearchQuery = (gametext_arr.length > 0 ? gametext_arr.slice(-1)[0] : "");
				webSearchQuery = replace_search_placeholders(webSearchQuery);
				webSearchQuery = webSearchQuery.trim();
				if(webSearchQuery=="")
				{
					webSearchQuery = (gametext_arr.length > 1 ? gametext_arr.slice(-2,-1)[0] : "");
				}
			}
			webSearchQuery = replace_search_placeholders(webSearchQuery);
			webSearchQuery = webSearchQuery.trim();
			webSearchQuery = webSearchQuery.replace(/(?:\r\n|\r|\n)/g, '. ');

			if(websearch_multipass && gametext_arr.length > 0)
			{
				let search_context = concat_gametext(true, ""); //will be truncated later

				//use tool call to generate the search prompt to be used
				generate_websearch_prompt(search_context,webSearchQuery,(generated_searchstr)=>{
					webSearchQuery = generated_searchstr;
					proceedSearching();
				});
			}
			else
			{
				proceedSearching();
			}
		}
		else
		{
			lastSearchResults = [];
			lastSearchQuery = "";
			websearch_in_progress = false;
			onDone();
		}
	}

	//LTM TextDB Memsnipper searching
	//searches dbText for searchStr and recentTextStr, returns up to 3 results
	function DatabaseMinisearch(dbText, searchStr, recentTextStr)
	{	//predefined minisearch constants
		const chunkSize = documentdb_chunksize;
		const chunkSizeOverlap = chunkSize*0.5;
		const maxResultsPerSection = 5; //returns up to 5 matches per section
		const valuesToReturn = documentdb_numresults;
		const minSimilarity = 0.2;

		if(dbText=="" || searchStr=="")
		{
			return [];
		}

		//utility functions used in minisearch
		let cleanupSpecialTags = function(text) {
			text = text.replace(/\{\{\[INPUT\]\}\}/g, "").replace(/\{\{\[OUTPUT\]\}\}/g, "");
			text = text.replace(/\{\{\[INPUT_END\]\}\}/g, "").replace(/\{\{\[OUTPUT_END\]\}\}/g, "");
			text = text.replace(/\{\{\[SYSTEM\]\}\}/g, "").replace(/\{\{\[SYSTEM_END\]\}\}/g, "");
			return text;
		}

		let stripToTokens = function(text) {
			return cleanupSpecialTags(text).replace(/[^\w\s\d-]/g, " ").replace("\s+", " ");
		}

		let searchAndScore = function(searchStr, recentTextStr, paragraphs) {
			let searchSections = [];
			if(recentTextStr && recentTextStr!=searchStr) //extra nearby data passed to search
			{
				searchSections.push({term: stripToTokens(recentTextStr),strength: 1});
			}
			searchSections.push({term: stripToTokens(searchStr),strength: 2});

			let sectionResults = searchSections.map((entry) => {
				let term = entry.term, strength = entry.strength;
				let docs = miniSearch.search(term);
				if (docs.length === 0) {
					return [];
				}
				let maxScore = docs[0].score;
				return docs.slice(0, maxResultsPerSection).map(doc => {
					doc.score *= strength / maxScore;
					return doc;
				})
			}).flat();

			// Adds scores together across results to form a summary
			let sectionSummary = sectionResults.reduce((docs, doc) => {
				const existingDoc = docs.find((c) => c["id"] === doc["id"]);
				if (existingDoc) {
					existingDoc.score += doc.score;
				}
				else {
					docs.push(doc);
				}
				return docs;
			}, []);

			// Maps to the more simple standard output structure and sort by total score
			let comparisons = sectionSummary.map(doc => {
				return {
					match: doc.score,
					snippet: doc.snippet
				};
			}).sort((a, b) => {
				return (a.match > b.match ? -1 : 1);
			});

			// Scales each score by max score to get a proportional match relevance
			if (comparisons.length === 0) {
				return [];
			}
			let maxScore = comparisons[0].match;
			return comparisons.map(result => {
				result.match /= maxScore;
				return result;
			});
		}

		//step 1: chunk the dbtext into paragraph chunks
		let paragraphs = [];
		let allText = cleanupSpecialTags(dbText);
		allText = replaceAll(allText,recentTextStr,"");

		// Ensure placeholders are replaced to allow searching for user / character
		allText = replace_search_placeholders(allText)
		searchStr = replace_search_placeholders(searchStr)
		recentTextStr = replace_search_placeholders(recentTextStr)

		let i = 0, startLoc = 0;
		while (startLoc < allText.length && i < Number.MAX_SAFE_INTEGER) {
			let actualChunkStart = Math.max(0, startLoc - chunkSizeOverlap);
			let actualChunkEnd = Math.min(allText.length, actualChunkStart + chunkSize);
			let currentSnippet = allText.substring(actualChunkStart, actualChunkEnd);
			paragraphs.push(currentSnippet);
			startLoc = actualChunkEnd;
			i++;
		}
		paragraphs = paragraphs.map(c => c.replace(/\n\n/g, "\n")).filter(s => !!s);
		let pgcount = 0;
		paragraphs = paragraphs.map(txt => {
			pgcount += 1;
			return {
				id: pgcount,
				snippet: txt,
				text: stripToTokens(txt),
				category: "context"
			}
		});

		// a list of commonly used words that have little meaning and can be excluded from analysis.
		const stopwords = [
			'about', 'above', 'after', 'again', 'all', 'also', 'am', 'an', 'and', 'another',
			'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
			'between', 'both', 'but', 'by', 'came', 'can', 'cannot', 'come', 'could', 'did',
			'do', 'does', 'doing', 'during', 'each', 'few', 'for', 'from', 'further', 'get',
			'got', 'has', 'had', 'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how',
			'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'like', 'make', 'many', 'me',
			'might', 'more', 'most', 'much', 'must', 'my', 'myself', 'never', 'now', 'of', 'on',
			'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
			'said', 'same', 'see', 'she', 'should', 'since', 'so', 'some', 'still', 'such', 'take', 'than',
			'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
			'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
			'way', 'we', 'well', 'were', 'what', 'where', 'when', 'which', 'while', 'who',
			'whom', 'with', 'would', 'why', 'you', 'your', 'yours', 'yourself',
			'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
			'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', '1',
			'2', '3', '4', '5', '6', '7', '8', '9', '0', '_',
			'll', 're'
		];
		//step 2: initialize minisearch engine
		let miniSearch = new MiniSearch({
			fields: ["text"], // fields to index for full-text search
			storeFields: ['category', "snippet"], // fields to return with search results
			searchOptions: {
				fuzzy: 0,
				bm25: { // https://lucaong.github.io/minisearch/types/MiniSearch.BM25Params.html
					b: 0.7, // Normalisation for the length of the string
					d: 0.7, // Minimum significance of a term showing up once
					k: 1.5 // Term frequency falloff (higher values allow for bigger differences based on amount of repetition of terms)
				}
			},
			processTerm: (term, _fieldName) => {
				let processedTerm = stopwords.includes(term.toLowerCase()) ? false : MiniSearch.getDefault("processTerm")(term);
				return processedTerm;
			},
			tokenize: (str) => {
				let terms = MiniSearch.getDefault("tokenize")(str);
				return terms.concat(terms.map(porterStemmer));
			}
		});
		miniSearch.addAll(paragraphs); //populate minisearch with paragraphs

		//step 3: run the search over the dbText to generate matches
		let searchResults = searchAndScore(searchStr,recentTextStr,paragraphs);
		searchResults = searchResults.filter(x=>x.match>minSimilarity);
		searchResults = searchResults.slice(0, valuesToReturn);
		return searchResults;
	}