(($) => {
    const evalStatus = (() => {
        const slopes = [0.5, 0.8, 1.0, 1.3, 1.6, 1.8, 2.1, 2.4, 2.6, 2.8, 2.9, 3.0, 3.1, 3.3, 3.4, 3.5, 3.9, 4.1, 4.2, 4.3, 5.2, 5.5, 6.6, 6.8, 6.8];
        const corrects = [1, 5, 10, 16, 19, 21];
        return (status) => {
            const st = Math.max(0, Math.min(1200, status));
            const x = Math.floor(st / 50);
            return Array.from({length: x}, (v, i) => i).reduce((s, t) => s + Math.round(50 * slopes[t]) + (corrects.includes(t) ? 1 : 0), 0) + Math.round(st % 50 * slopes[x]);
        };
    })();

    const Status = class {
        constructor(spd, vit, pow, men, int) {
            this.spd = spd || 0;
            this.vit = vit || 0;
            this.pow = pow || 0;
            this.men = men || 0;
            this.int = int || 0;
        }

        /**
         * 
         * @param {Status} s
         * @returns {Status}
         */
        merge(s) {
            return new Status(this.spd + s.spd, this.vit + s.vit, this.pow + s.pow, this.men + s.men, this.int + s.int);
        }

        /**
         * 
         * @returns {Number}
         */
        calc() {
            return [this.spd, this.vit, this.pow, this.men, this.int].reduce((a, b) => a + evalStatus(b), 0);
        }
    };

    const estimateRank = (() => {
        const borders = [300, 600, 900, 1300, 1800, 2300, 2900, 3500, 4900, 6500, 8200, 10000, 12100, 14500, 15900, 17500];
        const ranks = ["G", "G+", "F", "F+", "E", "E+", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "S", "S+"];
        return (e) => {
            for (let i = 0; i < borders.length; i++) {
                if (e < borders[i]) {
                    return ranks[i];
                }
            }
            return "SS";
        };
    })();

    const evalPoint = () => {
        const findNumber = ($element, selector) => Number.parseInt($element.find(selector).val());
        const createStatus = ($element) => {
            if ($element.find(".status_fields").length === 0) {
                return new Status();
            }
            const v = ["spd", "vit", "pow", "men", "int"].map((field) => findNumber($element, "[data-field='" + field + "']"));
            return new Status(v[0], v[1], v[2], v[3], v[4]);
        };
        const uraStatus = (() => {
            const $ura = $("#ura");
            if ($ura.attr("data-selected") === "false") {
                return new Status();
            }
            const p = (() => {
                const racebonus = findNumber($ura, "[name='racebonus']") * findNumber($ura, "[name='racecount']:checked");
                const writer = findNumber($ura, "[name='writer']:checked");
                const director = findNumber($ura, "[name='director']:checked");
                const peer = findNumber($ura, "[name='peer']:checked");
                const ending = findNumber($ura, "[name='ending']:checked");
                return racebonus + writer + director + peer + ending;
            })();
            return new Status(p, p, p, p, p);
        })();
        const $current = $("#current");
        const skill = (() => {
            const unit = findNumber($current, "[name='star']:checked") === 2 ? 120 : 170;
            return unit * findNumber($current, "[name='unique']:checked");
        })();
        return skill + createStatus($current).merge(createStatus($("[data-group='training'][data-selected='true']"))).merge(uraStatus).calc();
    };

    const updateEval = () => {
        const e = evalPoint();
        const rank = estimateRank(e);
        $("[data-eval]").attr("data-eval", e).text(e);
        $("[data-rank]").attr("data-rank", rank).text(rank);
    };

    
    const adjustTrainings = () => {
        const $trainings = $("[data-group='training']");
        const $remove = $trainings.find(".remove");
        const count = $trainings.length;
        if (1 < count) {
            $remove.show();
        } else {
            $remove.hide();
        }
        if (count < 5) {
            $("#add").show();
        }
        $trainings.each((i, e) => $(e).find("legend").text("トレ候補" + (i + 1)));
    };

    const setupHandler = (() => {
        const disableGroup = (e) => {
            const $container = $(e.target).closest("[data-selected]");
            const group = $container.data("group");
            $("[data-group='" + group + "']").attr("data-selected", "false").find("[data-switch='disabled']").prop("disabled", true);
        };
        return ($t) => {
            $t.find("input").on("change", updateEval);
            $t.find("input[data-switch='enabled']").on("click", (e) => {
                disableGroup(e);
                $(e.target).closest("[data-selected]").attr("data-selected", "true").find("[data-switch='disabled']").prop("disabled", false);
                updateEval();
            });
            $t.find("input[data-switch='disabled']").on("click", (e) => {
                disableGroup(e);
                $(e.target).closest(".switch").find("[data-switch='disabled']").prop("disabled", true);
            });
            $t.find("[data-remove]").on("click", (e) => {
                $(e.target).closest("[data-group='training']").remove();
                adjustTrainings();
            });
        };
    })();

    var $trainingCache;
    const addNewTraining = () => {
        const handleNode = ($t) => {
            const count = $("[data-group='training']").length;
            if (4 < count) {
                return;
            }

            const $add = $("#add");
            const $c = $t.clone().insertBefore($add);
            setupHandler($c);
            if (4 <= count) {
                $add.hide();
            }
            adjustTrainings();
        };
        if ($trainingCache) {
            handleNode($trainingCache);
        } else {
            $.get("res/training.html", (node) => {
                $t = $(node);
                handleNode($t);
                $trainingCache = $t;
            });
        }
    };

    $(() => {
        $("form").on("submit", (e) => {
            e.preventDefault();
        });
        $("#add button").on("click", addNewTraining);
        $("#current").find("input").on("change", updateEval);
        setupHandler($("[data-group='training']"));
        setupHandler($("[data-group='ura']"));
        updateEval();
    });
})(jQuery);
