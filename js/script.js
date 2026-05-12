(function ($) {
  var displayBoot = true;
  var crtEffect = true;
  var ambientSound = false;

  // IE11 forEach polyfill
  if (
    typeof NodeList !== "undefined" &&
    NodeList.prototype &&
    !NodeList.prototype.forEach
  ) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  // Google Analytics Custom Events
  var gaCustomEventTrigger = document.querySelectorAll(".ga-ce");
  gaCustomEventTrigger.forEach(function (e, i) {
    e.addEventListener("click", function () {
      var category = this.dataset.category ? this.dataset.category : null,
        action = this.dataset.action ? this.dataset.action : null,
        label = this.dataset.label ? this.dataset.label : null,
        value = this.dataset.value ? this.dataset.value : 1;

      if (window.ga && ga.create) {
        ga("send", "event", category, action, label, value, null);
      }
    });
  });

  var sharePopups = undefined;
  sharePopups = {
    triggers: $(".share-popup"),

    init: function () {
      var self = this;
      self.triggers.click(function (e) {
        e.preventDefault();
        self.popup($(this).attr("href"));
      });
    },
    popup: function (target) {
      //console.log(target);
      popupWindow = window.open(target, "", "width=600,height=400");
      popupWindow.focus();
    },
  };
  sharePopups.init();

  var system = {
    view: $(".screen"),
    bios: $(".screen .bios"),
    started: false,
    loading: {
      audio: false,
      video: false,
    },
    ambientAudio: new Audio("sound/ambient.mp3"),
    //audioPlayer: new Audio(),
    audioPlayer: document.createElement("audio"),
    text: [
      "<p>SEBAH OS v1.0</p>",
      "<p>BIOS Version: 202601001 Release 1</p>",
      "<br />",
      "<p>CPU: NASTEK NPU-7 Phantom @ 3.14GHz ..... OK</p>",
      "<p>RAM: 32768K VOIDMEM DDR5 6400MHz ........ OK</p>",
      "<p>DSK: PHANTOM VT-1TB Gen5 NVMe ........... OK</p>",
      "<br />",
      "<p>Loading kernel ......................... OK</p>",
      "<p>Mounting filesystems ................... OK</p>",
      "<p>Starting services ...................... OK</p>",
      "<p>Loading window manager ................. OK</p>",
      "<br />",
      "<p>All systems nominal.</p>",
      "<br />",
      "<p>Portfolio BTS SIO SLAM &mdash; nassim SEBAH &mdash; EFREI Paris</p>",
      "<br />",
      "<p>Press Any Key to boot system</p>",
    ],
    actionHandlers: [
      [
        "play",
        () => {
          this.resumeTrack();
        },
      ],
      [
        "pause",
        () => {
          this.pauseTrack();
        },
      ],
      [
        "stop",
        () => {
          this.stopTrack();
        },
      ],
    ],
    init: function () {
      var self = this;

      self.setBodyHeight();

      var agent = navigator.userAgent.toLowerCase();
      self.isIPhone = agent.indexOf("iphone") != -1;

      self.displayTime();

      setTimeout(function () {
        self.boot();
      }, 100);

      for (const [action, handler] of self.actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.log(
            `The media session action "${action}" is not supported yet.`
          );
        }
      }

      $(window).on("keyup click", function (e) {
        if (!system.started) {
          self.bios.hide();
          self.setLoading(true);
          setTimeout(function () {
            $(".login").addClass("loaded");
            //$('.login input[type="password"]').focus();
            self.setLoading(false);
            setTimeout(function () { $("#lisezmoi").trigger("click"); }, 300);
          }, 1500);

          if (ambientSound && !self.isIPhone) {
            self.ambientAudio.play();
            $(self.ambientAudio).animate({ volume: 0.2 }, 3000);
          }
          system.started = true;
        }
      });

      // $(window).on('mousemove', function(e){
      //     $(".cursor").css({left:e.pageX, top:e.pageY});
      // });

      self.ambientAudio.loop = true;
      self.ambientAudio.volume = 0;
      self.ambientAudio.addEventListener("timeupdate", function () {
        var buffer = 0.44;
        if (this.currentTime > this.duration - buffer) {
          this.currentTime = 0;
          this.play();
        }
      });

      $(self.audioPlayer).on("ended", function () {
        self.stopTrack();
      });

      $(self.audioPlayer).on("stalled", function () {
        var audio = this;
        console.log("audio stalled");
        audio.load();
        //audio.play();
      });

      $("#video").on("stalled", function () {
        var video = this;
        console.log("video stalled");
        video.load();
        //video.play();
      });

      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("pause", () => {
          self.pauseTrack();
        });
        navigator.mediaSession.setActionHandler("play", () => {
          self.resumeTrack();
        });
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          self.audioPlayer.currentTime = details.seekTime;
        });
      }
    },
    setBodyHeight: function () {
      var self = this;
      $("body").css("height", window.innerHeight);

      setTimeout(self.setBodyHeight, 100);
    },
    setLoading: function (state) {
      var self = this;
      if (state) {
        $("body").addClass("loading");
      } else {
        $("body").removeClass("loading");
      }
    },
    formatAMPM: function (date) {
      var monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var strTime =
        hours +
        ":" +
        minutes +
        ampm +
        "<span> - " +
        monthNames[date.getMonth()] +
        ". " +
        date.getDate() +
        ", " +
        date.getFullYear() +
        "</span>";
      return strTime;
    },
    displayTime: function () {
      var self = this;
      var time = self.formatAMPM(new Date());
      $("#time").html(time);
      setTimeout(function () {
        self.displayTime();
      }, 1000);
    },
    boot: function () {
      var self = this;
      // hide fullscreen toggle on fucking iOS

      if (self.isIPhone) {
        $(".hide-on-ios").hide();
      }

      if (crtEffect) {
        $("body").addClass("crt");
      }
      if (!displayBoot) {
        self.bios.hide();
        $(".login").hide();
      } else {
        self.view.fadeIn(100, function () {
          var $cursor = $('<span class="bios-cursor"></span>');
          self.bios.append($cursor);
          var SPEED = 1;
          var li = 0;
          function colorize(s) {
            return s
              .replace(/(\bOK\b)/g, '<span class="bios-ok">$1</span>')
              .replace(/(\bDone\b)/g, '<span class="bios-done">$1</span>')
              .replace(/(\bEnabled\b)/g, '<span class="bios-en">$1</span>')
              .replace(/(\bNone\b)/g, '<span class="bios-muted">$1</span>')
              .replace(/(SEBAH OS v[\w.]+)/g, '<span class="bios-title">$1</span>')
              .replace(/(Portfolio BTS[^<]*)/g, '<span class="bios-info">$1</span>');
          }
          function nextLine() {
            if (li >= self.text.length) { $cursor.remove(); return; }
            var raw = self.text[li++];
            if (!raw || raw === '<br />') {
              $cursor.before('<br />');
              self.bios[0].scrollTop = self.bios[0].scrollHeight;
              setTimeout(nextLine, 25);
              return;
            }
            var $tmp = $('<div>').html(raw);
            var pText = $tmp.find('p').first().text();
            if (!pText) {
              $cursor.before(raw);
              self.bios[0].scrollTop = self.bios[0].scrollHeight;
              setTimeout(nextLine, 40);
              return;
            }
            var $p = $('<p>');
            $cursor.before($p);
            var ci = 0;
            var spd = SPEED + (raw.indexOf('...') > -1 ? 4 : 0);
            function tick() {
              if (ci < pText.length) {
                ci++;
                var typed = pText.slice(0, ci);
                if (Math.random() < 0.02 && ci > 3) {
                  var g = '!?#$@|~\xb1\xd7';
                  $p.text(typed.slice(0, -1) + g[Math.floor(Math.random() * g.length)]);
                  setTimeout(function () {
                    $p.text(typed);
                    self.bios[0].scrollTop = self.bios[0].scrollHeight;
                    setTimeout(tick, spd);
                  }, 45);
                } else {
                  $p.text(typed);
                  self.bios[0].scrollTop = self.bios[0].scrollHeight;
                  setTimeout(tick, spd + Math.floor(Math.random() * 7) - 3);
                }
              } else {
                $p.html(colorize($p.text()));
                setTimeout(nextLine, 28);
              }
            }
            tick();
          }
          nextLine();
        });
      }
    },
    toggleAmbientSound: function (status) {
      var self = this;
      if (status) {
        $(self.ambientAudio).animate({ volume: 0.2 }, 3000);
      } else {
        $(self.ambientAudio).animate({ volume: 0 }, 8000);
      }
    },
    loadTrack: function (item) {
      var self = this;
      //console.log('play', item);

      self.loading.video = false;
      self.loading.audio = false;

      self.setLoading(true);

      $(self.audioPlayer).on("canplay", function () {
        self.playTrack("audio");
      });

      $("#video").on("canplay", function () {
        self.playTrack("video");
      });

      self.playingTrack = item;
      item.addClass("active playing");
      var track = item.attr("data-sound");
      var video = item.attr("data-video");
      var title = item.attr("data-title");
      var album = item.attr("data-album");

      $("#video .mpeg").attr("src", "video/" + video + ".mp4");
      $("#video .webm").attr("src", "video/" + video + ".webm");
      $("#video").get(0).load();

      self.audioPlayer.src = "sound/" + track;
      self.audioPlayer.load();

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title,
          artist: "Toasty Digital",
          album: album,
          artwork: [
            {
              src: "img/cover/" + album + "_96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "img/cover/" + album + "_128x128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "img/cover/" + album + "_192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "img/cover/" + album + "_256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "img/cover/" + album + "_384x384.png",
              sizes: "384x384",
              type: "image/png",
            },
            {
              src: "img/cover/" + album + "_512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        });
      }
    },
    playTrack: function (media) {
      var self = this;
      if (media == "audio") {
        self.loading.audio = true;
      }
      if (media == "video") {
        self.loading.video = true;
      }
      if (self.loading.audio && self.loading.video) {
        self.setLoading(false);
        self.resumeTrack();
        $("body").addClass("media-playing");
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      }
    },
    stopTrack: function () {
      var self = this;
      //console.log('stop', self.playingTrack);

      $(self.audioPlayer).unbind("canplay");
      $("#video").unbind("canplay");
      $("body").removeClass("media-playing");

      $("#video").stop(true, true).fadeOut(800);
      setTimeout(function () {
        $("#video").get(0).pause();
      }, 800);
      self.audioPlayer.pause();
      self.playingTrack.removeClass("active playing");
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
      //self.toggleAmbientSound(true);
    },
    pauseTrack: function () {
      var self = this;
      //console.log('pause', self.playingTrack);
      $("#video").get(0).pause();

      self.audioPlayer.pause();
      navigator.mediaSession.playbackState = "paused";
      //self.toggleAmbientSound(true);
    },
    resumeTrack: function () {
      var self = this;
      //console.log('resume', self.playingTrack);
      $("#video").stop(true, true).fadeIn(800);
      $("#video").get(0).play();
      self.audioPlayerPromise = self.audioPlayer.play();
      //self.toggleAmbientSound(false);
    },
  };

  system.init();

  $(".login .hint a").on("click", function (e) {
    e.preventDefault();
    $(this).parent(".hint").find("a").hide();
    $(this).parent(".hint").find("span").show();
  });

  $(".login form").on("submit", function (e) {
    e.preventDefault();
    var answers = [
      "dGhlIGNvbGxlZ2UgZHJvcG91dA==",
      "bGF0ZSByZWdpc3RyYXRpb24=",
      "Z3JhZHVhdGlvbg==",
      "ODA4ICYgaGVhcnRicmVhaw==",
      "bXkgYmVhdXRpZnVsIGRhcmsgdHdpc3RlZCBmYW50YXN5",
      "eWVlenVz",
      "dGhlIGxpZmUgb2YgcGFibG8=",
      "eWU=",
      "amVzdXMgaXMga2luZw==",
      "eWFuZGhp",
      "dHVyYm9ncmFmeCAxNg==",
      "Z29vZCBhc3Mgam9i",
      "Y3J1ZWwgd2ludGVy",
      "Y3J1ZWwgc3VtbWVy",
      "c28gaGVscCBtZSBnb2Q=",
      "c3dpc2g=",
      "d2F2ZXM=",
      "bG92ZSBldmVyeW9uZQ==",
      "ZG9uZGE=",
    ];
    var value = $(".login form input[type=password]").val().toLowerCase();

    //console.log(btoa(value));
    if (answers.includes(btoa(value))) {
      $(".login").removeClass("loaded");
      setTimeout(function () {
        $(".login").hide();
        system.toggleAmbientSound(false);
        system.setLoading(false);
      }, 1800);
    } else {
      $(".login form input[type=password]").val("");
    }
  });

  $(".navbar .item.submenu button").on("click", function (e) {
    if (!$(this).parent(".submenu").hasClass("active")) {
      $(".navbar .item.submenu.active").removeClass("active");
      $(this).parent(".submenu").addClass("active");
    } else {
      $(".navbar .item.submenu.active").removeClass("active");
    }
  });

  $("body").on("click", function (e) {
    if ($(e.target).closest(".item.submenu.active").length <= 0) {
      $(".navbar .item.submenu.active").removeClass("active");
    }
    if ($(e.target).closest(".dialog, .navbar").length <= 0) {
      $(".dialog").css("display", "none").html("");
    }
    $(".file").removeClass("active");
  });

  $(".disabled").on("click", function (e) {
    e.preventDefault();
  });

  $("#about").on("click", function (e) {
    e.preventDefault();
    $(".navbar .item.submenu.active").removeClass("active");
    var content =
      '<div><p>Mixtapes by <a href="https://twitter.com/jonsantoast" target="_blank">toasty digital</a><br />' +
      'Website by <a href="https://linktr.ee/starfennec" target="_blank">starfennec</a><br />' +
      'Funny dancing lizard by <a href="https://twitter.com/ka92/" target="_blank">ka92</a>' +
      "</p></div>";
    $(".dialog").html(content).css("display", "flex");
  });

  $("#battery").on("click", function (e) {
    e.preventDefault();
    $(".navbar .item.submenu.active").removeClass("active");
    var content =
      "<div><p>Battery power courtesy of Tesla Petroleum. Tesla Petroleum is not liable for any burns, explosions, or airborne carcinogens caused by this battery pack. Battery pack is single use; Do not attempt to recycle.</p></div>";
    $(".dialog").html(content).css("display", "flex");
  });

  $("#fullscreen").on("click", function (e) {
    e.preventDefault();
    $(".navbar .item.submenu.active").removeClass("active");
    var elem = document.documentElement;

    if ($("body").hasClass("fullscreen")) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        document.msExitFullscreen();
      }
      $("body").removeClass("fullscreen");
    } else {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
      $("body").addClass("fullscreen");
    }
  });

  $("#restart").on("click", function (e) {
    e.preventDefault();
    location.reload();
  });

  $("#print").on("click", function (e) {
    $(".navbar .item.submenu.active").removeClass("active");
    e.preventDefault();
    window.open("img/CV – Nassim SEBAH.pdf", "_blank");
  });

  $("#switchfiles").on("click", function (e) {
    e.preventDefault();
    $(".navbar .item.submenu.active").removeClass("active");
    $(this).toggleClass("invert");
    $("body").toggleClass("show-hidden-files");
  });

  $("#folder1").on("click", function (e) {
    e.preventDefault();
    $(".finder").removeClass("focus");
    $(".finder.2k49").addClass("focus").show("slow");
    $(this).addClass("active");
  });

  $("#folder2").on("click", function (e) {
    e.preventDefault();
    $(".finder").removeClass("focus");
    $(".finder.gktfolder").addClass("focus").show("slow");
    $(this).addClass("active");
  });

  $("#folder3").on("click", function (e) {
    e.preventDefault();
    $(".finder").removeClass("focus");
    $(".finder.blondafolder").addClass("focus").show("slow");
    $(this).addClass("active");
  });

  $("#folder4").on("click", function (e) {
    e.preventDefault();
    $(".finder").removeClass("focus");
    $(this).addClass("active");
    setTimeout(function () {
      var content =
        "<div><p>File corrupted!<br />Please download it again.</p></div>";
      $(".dialog").html(content).css("display", "flex");
    }, 0);
    $(this).addClass("active");
  });

  $("#lizard").on("click", function (e) {
    e.preventDefault();
    $("#video2").get(0).play();
    $(".finder.fdl").addClass("focus").show();
  });

  $("#readme").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(".finder.readme").addClass("focus").show("slow");
  });

  $("#earththt").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(".finder.earth").addClass("focus").show("slow");
  });

  $(".finder .close").on("click", function (e) {
    e.preventDefault();
    $(this).closest(".finder").hide();
  });

  $(".play-track").on("click", function (e) {
    e.preventDefault();
    var item = $(this);
    if (!item.hasClass("playing")) {
      //system.toggleAmbientSound(false);
      system.setLoading(true);
      if (system.playingTrack) {
        system.stopTrack();
        setTimeout(function () {
          system.loadTrack(item);
        }, 800);
      } else {
        system.loadTrack(item);
      }
    }
  });

  $("#pause").on("click", function (e) {
    e.preventDefault();
    if (system.audioPlayer.paused) {
      $(this).removeClass("invert");
      system.resumeTrack();
    } else {
      $(this).addClass("invert");
      system.pauseTrack();
    }
  });
  $("#stop").on("click", function (e) {
    e.preventDefault();
    $("body").removeClass("media-playing");
    system.stopTrack();
  });

  $(".finder").on("mousedown click", function (e) {
    $(".finder.focus").removeClass("focus");
    $(this).addClass("focus");
  });

  $(".finder").each(function (i, e) {
    dragElement(e);
  });

  function dragElement(elmnt) {
    var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if ($(elmnt).find(".header").get(0)) {
      $(elmnt).find(".header").get(0).onmousedown = dragMouseDown;
      $(elmnt).find(".header").get(0).ontouchstart = dragMouseDown;
    } else {
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;
      elmnt.ontouchstart = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      if (e.cancelable) {
        /* e.preventDefault(); */
      }
      // get the mouse cursor position at startup:
      if (e.touches) {
        var clientX = e.touches[0].pageX;
        var clientY = e.touches[0].pageY;
      } else {
        var clientX = e.clientX;
        var clientY = e.clientY;
      }

      pos3 = clientX;
      pos4 = clientY;

      document.onmouseup = closeDragElement;
      document.ontouchend = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      if (e.cancelable) {
        e.preventDefault();
      }

      if (e.touches) {
        var clientX = e.touches[0].pageX;
        var clientY = e.touches[0].pageY;
      } else {
        var clientX = e.clientX;
        var clientY = e.clientY;
      }
      // calculate the new cursor position:
      pos1 = pos3 - clientX;
      pos2 = pos4 - clientY;
      pos3 = clientX;
      pos4 = clientY;

      var posY = elmnt.offsetTop - pos2 >= 28 ? elmnt.offsetTop - pos2 : 28;
      var posX = elmnt.offsetLeft - pos1 >= 0 ? elmnt.offsetLeft - pos1 : 0;
      // set the element's new position:
      elmnt.style.top = posY + "px";
      elmnt.style.left = posX + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.ontouchend = null;
      document.onmousemove = null;
      document.ontouchmove = null;
    }
  }
})(jQuery);
