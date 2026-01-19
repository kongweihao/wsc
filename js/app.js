
new Vue({
	el: '#app',
	data() {
		return {
			// locationParam 参数值设置
			// 解析 URL 查询参数为对象，便于按键名读取
			// 鉴权模块敬请期待：从 URL 查询参数中获取 account 参数值，传递给后端接口以识别用户身份
			locationParam: (() => {
				const query = new URLSearchParams(window.location.search || '');
				const obj = {};
				query.forEach((v, k) => { obj[k] = v; });
				return obj;
			})(),
			myChart: null,
			chartEventTarget: null,
			userInfo: null,
			authBlocked: false,
			focusedCableId: null,
			focusedFeatureId: null,
			focusMode: 'none',
			focusedLanding: null,
			faultApiModes: [
				{ key: 'local-docker', name: '本地docker模式', host: '127.0.0.1:801', autoDetect: true },
				{ key: 'local-xampp', name: '本地模式', host: '127.0.0.1', autoDetect: false }
			],
			faultApiMode: 'oa',
			faultApiModePrev: 'oa',
			faultApiReachability: {},
			modeSwitching: false,
			mapLoading: true,
			mapLoadingText: '',
			liveScenarioRunning: false,
			// 实况模式状态：当前运行模式、是否外部中止、进入前的自转快照（便于停止时恢复）
			liveScenarioMode: null,
			liveScenarioAbort: false,
			liveScenarioPrevAutoRotate: false,
			liveScenarioPrevAutoRotateSpeed: 0.9,
			// 2D 海缆重算模式（仅 2D 模式可用）
			twoDRebuildOptions: [
				{ key: 'saved', name: '加载已保存结果（默认）' },
				{ key: 'recompute-auto', name: '重算并保存（自动）' },
				{ key: 'recompute-py3', name: '重算并保存（py3）' },
				{ key: 'recompute-py2', name: '重算并保存（py2）' },
				{ key: 'recompute-php', name: '重算并保存（php）' }
			],
			twoDRebuildMode: 'saved',
			// 2D 地图版本切换
			// 2D 地图版本选项：脚本地址用于加载底图，新增瓦片地图选项（若脚本缺失会自动回退）
			mapVersionOptions: [
				{ key: 'ap-zh', name: '汉化亚太中心世界地图', script: 'js/worldZH（以中国为中心）.js' },
				{ key: 'std-zh', name: '汉化标准版世界地图', script: 'js/worldZH.js' },
				{ key: 'std-en', name: '英文标准世界地图', script: 'js/world.js' },
				{ key: 'tiles', name: '瓦片地图（实验）', script: 'js/world.tiles.js' }
			],
			mapVersion: 'ap-zh',
			mapVersionPrev: 'ap-zh',
			helpVisible: false,
			// 3D 海缆重算选项与状态
			threeDRebuildOptions: [
				{ key: 'saved', name: '加载已保存结果（默认）' },
				{ key: 'recompute-auto', name: '重算并保存（自动）' },
				{ key: 'recompute-py3', name: '重算并保存（py3）' },
				{ key: 'recompute-py2', name: '重算并保存（py2）' },
				{ key: 'recompute-php', name: '重算并保存（php）' }
			],
			threeDRebuildMode: 'saved',
			threeDArcStepOptions: [
				{ value: 100, label: '更平滑（100 km）' },
				{ value: 150, label: '均衡（150 km，默认）' },
				{ value: 200, label: '更轻量（200 km）' }
			],
			threeDArcStepKm: 150,
			_globeRebuildCache: {},
			_suppressUpdate: false,
			// 每条数据项语言偏好（默认中文）
			langPref: { cable: {}, landing: {} },
			// 弹窗状态
			modal: { show: false, type: null, line: null, lp: null, detail: null },
			// 动效计时占位（可按需扩展）
			pulseExpiry: 0,
			pulseTimer: null,
			nowTs: Date.now(),
			nowTickTimer: null,
			selectedOwnerships: ['自建', '合建', '租用'],
			selectedTypes: ['跨太平洋', '亚欧互联', '区域互联', '其他'],
			scopeContinent: 'all',
			scopeDistance: 'all',
			ownershipOnly: true,
			isMapFullscreen: false,
			mapDialOpen: false,
			// 右侧列表分栏比例（可拖拽）
			leftPanePct: 50,
			topHeightPct: 55,
			// 三栏外侧列宽（仅大屏模式可拖拽）
			leftColPct: 16.7,
			centerColPct: 50.0,
			rightColPct: 32.7,
			// 浮动面板状态
			floatingPanel: { active: false, type: null, x: 0, y: 0, w: 820, h: 520, minW: 360, minH: 260, dragging: false, resizing: false, _dx: 0, _dy: 0 },
			isCompactMode: false,
			compactPanelWidth: 420,
			compactCollapsed: false,
			compactActiveTab: 'overview',
			userToggledCompact: false,
			isGlobe: false,
			legendVisible: false,
			focusTargetCoord: null,
			focusedFaultLineIds: [],
			globeTextures: { base: '', height: '', layer: '' },
			titleBgOptions: [
				{ key: 'banner-default', name: '科技蓝光', url: 'img/主标题/蓝色科技风主标题.png' },
				{ key: 'banner-alt1', name: '深蓝流线', url: 'img/主标题/其他海缆主标题.png' },
				{ key: 'banner-alt2', name: '黑客流光', url: 'img/主标题/黑客科技风主标题.png' },
			],
			currentTitleBgKey: 'banner-default',
			globeTextureOptions: [
				{ key: 'topo', name: '地形（默认）', base: '3D 地图资源/world.topo.bathy.200401.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/world.topo.bathy.200401.jpg' },
				{ key: 'day8k', name: '白昼 8K', base: '3D 地图资源/earth-day-8k-sss.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-day-8k-sss.jpg' },
				{ key: 'day2k', name: '白昼 2K', base: '3D 地图资源/earth-day-2k-sss.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-day-2k-sss.jpg' },
				{ key: 'night8k', name: '夜光 8K', base: '3D 地图资源/earth-night-8k-sss.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-night-8k-sss.jpg' },
				{ key: 'night2k', name: '夜光 2K', base: '3D 地图资源/earth-night-2k-sss.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-night-2k-sss.jpg' },
				{ key: 'day', name: '标准白昼（旧）', base: '3D 地图资源/earth-day.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-day.jpg' },
				{ key: 'night', name: '城市夜光（旧）', base: '3D 地图资源/earth-night.jpg', height: '3D 地图资源/bathymetry_bw_composite_4k.jpg', layer: '3D 地图资源/earth-night.jpg' },
				// { key: 'biaozhun', name: '国际标准地图', base: '3D 地图资源/国际标准地图.png', height: '3D 地图资源/国际标准地图.png', layer: '3D 地图资源/国际标准地图.png' }
			],
			currentGlobeTextureKey: 'topo',
			globeMaxDistance: 320,
			autoRotate: false,
			autoRotateSpeed: 0.9,
			// 首次进入 3D 时自动“聚焦→退出”一次以稳定视角
			globeInitFocusedOnce: false,
			// 2D/3D 视图缩放状态
			geoZoom: 1.8,
			globeDistance: 130,
			// 2D 底图纹理下拉移除：改用统一的底色风格 mapTextureStyleOptions
			// 统一缩放滑条（0-100）
			zoomSlider: 50,
			defaultZoomSlider: 50,
			// 登陆站聚焦时是否显示关联海缆
			landingShowAssociated: true,
			// 聚焦名称显示控制
			showCableLabels: true,
			showLandingLabels: false,
			// 图层显示控制
			showCables: true,
			showLandings: true,
			// 动效控制：走线流光动画（默认关闭，需手动开启以减轻性能负担）
			lineEffectEnabled: false,
			cablePage: 1,
			cablePageSize: 50,
			cablePageInput: 1,
			cablePaginationAdvanced: false,
			// 右侧列表搜索框
			searchCable: '',
			searchLanding: '',
			searchFault: '',
			// 地图显示故障海缆
			showFaultCablesOnMap: true,
			// 悬停同步高亮：当前悬停海缆ID
			hoveredCableId: null,
			// 故障列表（来自接口）
			faultsFromApi: [],
			// 故障接口不可用时的演示模式：预置数据、自动/手动开关、真实数据缓存
			useDemoFaults: false,
			demoFaultsAuto: false,
			demoFaultsPreset: [
				{
					name: 'DEMO-太平洋 A 段光缆异常',
					desc: '演示：跨洋主干光功率骤降，待排查外力影响。',
					registrar: '演示值班员',
					sameRoute: '跨洋主干 A 段',
					start: '2025-12-05 10:24',
					end: '',
					workOrder: 'DEMO-PA-001',
					isMajor: '是',
					cableName: 'PAC',
					cause: '待排查（演示）',
					progress: '演示：已通知船舶靠近测量',
					impact: '跨洋业务切至保护路由（演示）',
					remark: '演示数据，用于接口不可用兜底展示。',
					lastModifier: '演示模式',
					faultId: 'demo-pa-1',
					involvedCable1: 'PAC',
					involvedLanding1: '上海',
					distance1: '12450',
					pointCoord1: '121.47,31.23'
				},
				{
					name: 'DEMO-亚欧段局端阻断',
					desc: '演示：局端电源维护导致链路阻断，业务走保护。',
					registrar: '演示值班员',
					sameRoute: '亚欧骨干东段',
					start: '2025-11-12 06:40',
					end: '',
					workOrder: 'DEMO-EU-017',
					isMajor: '否',
					cableName: 'FLAG North Asia Loop/REACH North Asia Loop',
					cause: '局端维护（演示）',
					progress: '演示：正在分光测量并切换业务',
					impact: '国际专线半保护（演示）',
					remark: '演示用途，接口故障时显示。',
					lastModifier: '演示模式',
					faultId: 'demo-eu-2',
					involvedCable1: 'FLAG North Asia Loop/REACH North Asia Loop',
					involvedLanding1: 'Wada, Japan',
					distance1: '1279.13',
					pointCoord1: '134.406703,25.722160',
				}
			],
			lastRealFaults: [],
			faultsLoading: true,
			realtimeEnabled: false,
			realtimeTimerId: null,
			realtimeCountdown: 0,
			realtimeCountdownTimerId: null,
			realtimeMessage: '',
			// 故障影响集合（海缆/登陆站）：用于同步列表状态徽标
			faultAffectedCableKeySet: {},
			faultInvolvedLandingIdSet: {},
			// 故障列表展开状态
			faultExpand: {},
			// 故障左右布局选择 
			selectedFaultIndex: -1,
			selectedFault: null,
			faultPanelExpanded: false,
			faultTooltip: { show: false, left: 0, top: 0, fault: null },
			faultTooltipWidth: 760,
			cableTooltipWidth: 380,
			landingTooltipWidth: 380,
			faultEditState: { active: false, index: null, cable: '', landing: '', distance: '', pointCoord: '', picking: false, saving: false, error: '' },
			faultOverlayMode: false,
			faultPointMarker: null,
			faultPickHover: null,
			faultPickLast: null,
			faultPickConfirmVisible: false,
			faultPickConfirmInfo: null,
			faultPickPath: null,
			classifyStats: {
				默认: {
					businessesTotal: 1259,
					equityTotal: 212106.901,
					lengthTotal: 213839,
					lightUpBandwidthTotal: 89730,
					usingBandwidthTotal: 70570,
					utilizationRateTotal: 78.647
				},
				亚太: {
					businessesTotal: 622,
					equityTotal: 98925.07,
					lengthTotal: 82504,
					lightUpBandwidthTotal: 45250,
					usingBandwidthTotal: 38670,
					utilizationRateTotal: 85.459
				},
				其他: {
					businessesTotal: 101,
					equityTotal: 11200,
					lengthTotal: 281,
					lightUpBandwidthTotal: 370,
					usingBandwidthTotal: 200,
					utilizationRateTotal: 54.054
				},
				欧洲: {
					businessesTotal: 293,
					equityTotal: 28280,
					lengthTotal: 70000,
					lightUpBandwidthTotal: 16280,
					usingBandwidthTotal: 12030,
					utilizationRateTotal: 73.894
				},
				澳洲: {
					businessesTotal: 10,
					equityTotal: 2200,
					lengthTotal: 9540,
					lightUpBandwidthTotal: 400,
					usingBandwidthTotal: 340,
					utilizationRateTotal: 85
				},
				美国: {
					businessesTotal: 233,
					equityTotal: 71501.831,
					lengthTotal: 51514,
					lightUpBandwidthTotal: 27430,
					usingBandwidthTotal: 19330,
					utilizationRateTotal: 70.47
				}
			},
			// 概览面板当前区域
			overviewRegion: '默认',
			// 概览面板展示用的动态数值（通过动画平滑过渡）
			overviewDisplayMetrics: {
				businessesTotal: 0,
				equityTotal: 0,
				lengthTotal: 0,
				lightUpBandwidthTotal: 0,
				usingBandwidthTotal: 0,
				utilizationRateTotal: 0
			},
			overviewAnimFrame: null,
			// 2D 地图底色风格（下拉选择，多风格可切换）
			mapTextureStyleOptions: [
				{ key: 'gray', name: '灰阶简约（默认）' },
				{ key: 'ink', name: '墨蓝深海' },
				{ key: 'aurora', name: '极光青蓝' },
				{ key: 'sand', name: '沙岸暖金' },
				{ key: 'slate', name: '石板蓝灰' },
				{ key: 'cyber', name: '霓虹夜行' },
				{ key: 'multination', name: '多国配色（经典）' },
				{ key: 'multination-tech', name: '多国配色（明亮）' },
				{ key: 'multination-pastel', name: '多国配色（柔和）' }
			],
			mapTextureStyle: 'gray',
			// 3D 光效开关（bloom 与大气辉光），谨慎切换以避免跷跷板
			globeGlowEnabled: true,
			// 3D 光效风格下拉（默认当前风格）
			globeGlowStyleOptions: [
				{ key: 'default', name: '标准光效（默认）' },
				{ key: 'soft', name: '柔和自然' },
				{ key: 'cinema', name: '电影质感' },
				{ key: 'noon', name: '正午高亮' },
				{ key: 'night', name: '夜景对比' }
			],
			globeGlowStyle: 'default',
			// 3D 光效亮度（拖动滑条调节整体光效强度）
			globeGlowBrightness: 1.0,
			defaultGlobeGlowBrightness: 1.0,
			landingPoints: [],
			landingOwnershipOnly: true,
			// 登陆站分页
			landingPage: 1,
			landingPageSize: 50,
			landingPageInput: 1,
			landingPaginationAdvanced: false,
			cableLines: [],
			cableDetail: { id: null, line: null, detail: null, loading: false },
			cableDetails: {},
			textExpand: {},
			// 登陆站详情面板
			landingDetail: { id: null, lp: null, detail: null, loading: false, cableLimit: 8 },
			// 简略 tooltip
			landingTooltip: { show: false, left: 0, top: 0, lp: null, detail: null, selectedCableIds: [], expanded: false },
			liveDistanceCollapsed: false,
			liveDistanceMasked: false,
			tipExtraCollapsed: true,
			mapTooltipLandingExpandedId: null,
			cableTooltip: { show: false, left: 0, top: 0, line: null, detail: null },
			// 登陆站详情缓存
			stationDetails: {}
		}
	},
	computed: {
		landingNameOptions() {
			return (this.landingList || []).map(lp => lp.name).filter(Boolean);
		},
		cableNameOptions() {
			const names = (this.cableLines || []).map(l => l.name).filter(Boolean);
			const fromFaults = (this.faultsFromApi || []).flatMap(f => [f.cableName, f.involvedCable1, f.involvedCable2, f.involvedCable3]).filter(Boolean);
			return Array.from(new Set([...names, ...fromFaults]));
		},
		cableLandingMap() {
			const map = new Map();
			const globalList = (typeof cableData !== 'undefined' && Array.isArray(cableData))
				? cableData
				: Array.isArray(window.cableData)
					? window.cableData
					: Array.isArray(globalThis.cableData)
						? globalThis.cableData
						: [];
			const list = Array.isArray(globalList) ? globalList : [];
			const attach = (key, arr) => {
				const k = this.normalizeText(key || '').toLowerCase();
				if (!k || !arr.length) return;
				map.set(k, Array.from(new Set(arr.map(n => this.formatLandingName(n)))));
			};
			list.forEach(item => {
				const detail = item?.detail || {};
				const lps = this.normalizeLandingPoints(detail).map(lp => lp.name).filter(Boolean);
				if (!lps.length) return;
				attach(item?.feature_id, lps);
				attach(item?.id, lps);
				attach(item?.name, lps);
			});
			Object.entries(this.cableDetails || {}).forEach(([id, detail]) => {
				const lps = this.normalizeLandingPoints(detail || {}).map(lp => lp.name).filter(Boolean);
				if (!lps.length) return;
				attach(id, lps);
			});
			return map;
		},
		landingOptionsForEdit() {
			const cableRaw = this.normalizeText(this.faultEditState.cable || '').toLowerCase();
			if (!cableRaw) return [];
			const candidate = (this.cableLines || []).find(l => {
				const cands = [l.feature_id, l.id, l.name].map(v => this.normalizeText(v || '').toLowerCase());
				return cands.includes(cableRaw);
			});
			const key = candidate ? this.normalizeText(candidate.feature_id || candidate.id || candidate.name || '').toLowerCase() : cableRaw;
			const detail = candidate && candidate.id ? this.cableDetails[candidate.id] : null;
			const fromDetail = (() => {
				if (!detail) return [];
				const list = this.normalizeLandingPoints(detail).filter(Boolean);
				if (!list.length) return [];
				const landingArr = Array.isArray(this.landingPoints) ? this.landingPoints : [];
				const names = list.map(lp => {
					const lid = lp.id || lp.landing_point_id || lp.name;
					const norm = this.formatLandingName(lid || '').toLowerCase();
					const match = landingArr.find(p => {
						const pid = this.formatLandingName(p.id || '').toLowerCase();
						const pname = this.formatLandingName(p.name || '').toLowerCase();
						return pid === norm || pname === norm;
					});
					return (match && match.name) || lp.name || lid;
				}).filter(Boolean);
				return Array.from(new Set(names));
			})();
			const opts = (fromDetail && fromDetail.length) ? fromDetail : (this.cableLandingMap.get(key) || []);
			return opts.length ? opts : [];
		},
		currentTitleBgUrl() {
			const opt = this.titleBgOptions.find(o => o.key === this.currentTitleBgKey);
			return (opt && opt.url) || 'img/title-banner.jpg';
		},
		withMetrics() {
			const toRad = d => d * Math.PI / 180;
			const R = 6371;
			const km = (a, b) => {
				if (!a || !b || a.length < 2 || b.length < 2) return 0;
				const dLat = toRad(b[1] - a[1]);
				const dLon = toRad(b[0] - a[0]);
				const lat1 = toRad(a[1]);
				const lat2 = toRad(b[1]);
				const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
				return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
			};
			return this.cableLines.map(l => {
				const coords = Array.isArray(l.coords) ? l.coords.filter(p => Array.isArray(p) && p.length >= 2) : [];
				const start = coords[0];
				const end = coords[coords.length - 1] || start;
				const distance = start && end ? Math.round(km(start, end)) : 0;
				return { ...l, km: distance };
			});
		},
		filteredCablesMap() {
			return this.withMetrics.filter(l => {
				if (this.selectedOwnerships.length === 0) return false;
				if (!this.selectedTypes.includes(l.type)) return false;
				const ownershipLabel = l.ownership || l.rights || l.权益类型 || l.ownershipType || '';
				const filterLabel = ownershipLabel || '非权益';
				if (!this.selectedOwnerships.includes(filterLabel)) return false;
				// 洲别筛选：当选择具体洲别时，仅显示该洲别，未标注的也不显示
				if (this.scopeContinent !== 'all') {
					if (!l.continent || l.continent === 'all' || l.continent !== this.scopeContinent) return false;
				}
				if (this.scopeDistance !== 'all') {
					if (this.scopeDistance === '>5000' && !(l.km > 5000)) return false;
					if (this.scopeDistance === '<5000' && !(l.km < 5000)) return false;
				}
				return true;
			});
		},
		filteredCablesList() {
			// 列表侧仅跟随类型/距离/洲别，不受“权益类型”影响，避免筛选过窄
			return this.withMetrics.filter(l => {
				if (!this.selectedTypes.includes(l.type)) return false;
				if (this.scopeContinent !== 'all') {
					if (!l.continent || l.continent === 'all' || l.continent !== this.scopeContinent) return false;
				}
				if (this.scopeDistance !== 'all') {
					if (this.scopeDistance === '>5000' && !(l.km > 5000)) return false;
					if (this.scopeDistance === '<5000' && !(l.km < 5000)) return false;
				}
				return true;
			});
		},
		landingList() {
			// 登陆站列表解耦：始终展示全量登陆站数据，不受线路筛选或权益勾选影响
			const list = (this.landingPoints && this.landingPoints.length)
				? this.landingPoints
				: (() => {
					const set = new Set();
					const arr = [];
					(this.withMetrics || []).forEach(l => (l.coords || []).forEach(c => {
						const coordStr = c.join(',');
						if (set.has(coordStr)) return;
						set.add(coordStr);
						arr.push({ name: `登陆站 ${arr.length + 1}`, coords: c, coordStr, country: '未标注', ownership: '非权益', ownershipClass: this.ownershipClass('非权益') });
					}));
					return arr;
				})();
			const normalized = list.map(lp => {
				const ownershipLabel = lp?.ownership || '非权益';
				return { ...lp, ownership: ownershipLabel, ownershipClass: lp?.ownershipClass || this.ownershipClass(ownershipLabel) };
			});
			return [...normalized].sort((a, b) => {
				const wa = this.ownershipWeight(a.ownership || '非权益');
				const wb = this.ownershipWeight(b.ownership || '非权益');
				if (wb !== wa) return wb - wa;
				return (a.name || '').localeCompare(b.name || '');
			});
		},
		faultList() {
			if (Array.isArray(this.faultsFromApi) && this.faultsFromApi.length) return this.faultsFromApi;
			return this.filteredCablesMap.filter(l => l.status === 'err');
		},
		stats() {
			const selfCables = this.withMetrics.filter(l => l.ownership === '自建').length;
			const coCables = this.withMetrics.filter(l => l.ownership === '合建').length;
			const rentCables = this.withMetrics.filter(l => l.ownership === '租用').length;
			return {
				totalCables: this.withMetrics.length,
				totalLandings: this.landingPoints.length
					? this.landingPoints.length
					: new Set(this.withMetrics.flatMap(l => l.coords.map(c => c.join(',')))).size,
				okCount: this.withMetrics.filter(l => l.status === 'ok').length,
				errCount: this.withMetrics.filter(l => l.status === 'err').length,
				ownedCables: selfCables + coCables + rentCables,
				ownedLandings: (this.landingPoints || []).filter(lp => (lp.ownership || '') !== '非权益').length,
				selfCables,
				coCables,
				rentCables
			};
		}
		,
		faultCount() {
			// 故障数改为“所有故障定位点涉及的唯一海缆数量”，无定位信息时退回涉及海缆名称
			const list = Array.isArray(this.displayFaults) ? this.displayFaults : [];
			const uniq = new Set();
			const normalize = (val) => {
				const txt = this.normalizeText ? this.normalizeText(String(val || '')) : String(val || '');
				return txt.trim().toLowerCase();
			};
			list.forEach(f => [1, 2, 3].forEach(idx => {
				const raw = f && f[`involvedCable${idx}`];
				if (!raw) return;
				uniq.add(normalize(raw));
			}));
			if (!uniq.size) {
				list.forEach(f => {
					const alt = f && (f.cableName || f.name);
					if (alt) uniq.add(normalize(alt));
				});
			}
			return uniq.size || list.length || 0;
		},
		// 概览面板数据视图
		overviewMetrics() {
			const r = this.overviewRegion || '默认';
			const dict = this.classifyStats || {};
			return dict[r] || dict['默认'] || { businessesTotal: 0, equityTotal: 0, lengthTotal: 0, lightUpBandwidthTotal: 0, usingBandwidthTotal: 0, utilizationRateTotal: 0 };
		}
		,
		// 右侧列表展示（含搜索过滤）
		displayCablesRaw() {
			const q = this.searchCable.trim().toLowerCase();
			// 按名称分组合并，同名海缆仅显示一条（选择“最佳”代表项）
			const groups = new Map();
			for (const l of this.filteredCablesList) {
				const key = (this.normalizeText(l.name || '') || '').toLowerCase();
				if (!key) continue;
				const wa = this.ownershipWeight(l.ownership);
				const cur = groups.get(key);
				if (!cur) {
					groups.set(key, { rep: l, weight: wa });
				} else {
					const wb = cur.weight;
					// 选择权重更高者；如权重相同，优先故障，再按名称与id稳定择一
					const better = () => {
						if (wa !== wb) return wa > wb;
						const sa = l.status === 'err' ? 1 : 0;
						const sb = cur.rep.status === 'err' ? 1 : 0;
						if (sa !== sb) return sa > sb;
						const na = (l.name || '').localeCompare(cur.rep.name || '') > 0;
						if (na) return true;
						// 最后按 id 文本稳定选择
						return String(l.id || '').localeCompare(String(cur.rep.id || '')) < 0;
					};
					if (better()) groups.set(key, { rep: l, weight: wa });
				}
			}
			const base = Array.from(groups.values()).map(g => g.rep);
			const sortedBase = base.sort((a, b) => {
				const wa = this.ownershipWeight(a.ownership);
				const wb = this.ownershipWeight(b.ownership);
				if (wb !== wa) return wb - wa;
				return (a.name || '').localeCompare(b.name || '');
			});
			if (!q) return sortedBase;
			const withScores = sortedBase
				.map(l => ({ item: l, score: this.searchPriority(l.name || '', q) }))
				.filter(x => ((l => (l.name || '').toLowerCase().includes(q))(x.item)));
			return withScores
				.sort((a, b) => {
					if (b.score !== a.score) return b.score - a.score;
					const wa = this.ownershipWeight(a.item.ownership);
					const wb = this.ownershipWeight(b.item.ownership);
					if (wb !== wa) return wb - wa;
					return (a.item.name || '').localeCompare(b.item.name || '');
				})
				.map(x => x.item);
		},
		cableTotal() {
			return this.displayCablesRaw.length;
		},
		cableTotalPages() {
			return Math.max(1, Math.ceil(this.cableTotal / this.cablePageSize));
		},
		cablePageItems() {
			const start = (this.cablePage - 1) * this.cablePageSize;
			return this.displayCablesRaw.slice(start, start + this.cablePageSize);
		},
		displayLandings() {
			const q = this.searchLanding.trim().toLowerCase();
			const list = this.landingList;
			if (!q) return list;
			const filtered = list.filter(lp =>
				(lp.name || '').toLowerCase().includes(q)
				|| (lp.coordStr || '').toLowerCase().includes(q)
			);
			const withScores = filtered.map(lp => ({ item: lp, score: this.searchPriority(lp.name || '', q) }));
			return withScores.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				const wa = this.ownershipWeight(a.item.ownership || '非权益');
				const wb = this.ownershipWeight(b.item.ownership || '非权益');
				if (wb !== wa) return wb - wa;
				return (a.item.name || '').localeCompare(b.item.name || '');
			}).map(x => x.item);
		},
		landingTotal() {
			return this.displayLandings.length;
		},
		landingTotalPages() {
			return Math.max(1, Math.ceil(this.landingTotal / this.landingPageSize));
		},
		landingPageItems() {
			const start = (this.landingPage - 1) * this.landingPageSize;
			return this.displayLandings.slice(start, start + this.landingPageSize);
		},
		landingCableLimited() {
			const detail = this.landingDetail.detail;
			if (!detail || !detail.cables) return [];
			const limit = this.landingDetail.cableLimit;
			if (limit === 'all') return detail.cables;
			const n = Number(limit) || 8;
			return detail.cables.slice(0, n);
		},
		landingCableVisibleCount() {
			const detail = this.landingDetail.detail;
			if (!detail || !detail.cables) return 0;
			const limit = this.landingDetail.cableLimit;
			if (limit === 'all') return detail.cables.length;
			const n = Number(limit) || 8;
			return Math.min(n, detail.cables.length);
		},
		displayFaults() {
			const q = this.searchFault.trim().toLowerCase();
			const base = this.faultList.map(f => f);
			const filtered = !q ? base : base.filter((f) => {
				const fields = [f.name, f.cableName, f.workOrder, f.id, f.feature_id];
				return fields.some(val => val && String(val).toLowerCase().includes(q));
			});
			const withScores = filtered.map((f) => {
				const score = q ? this.searchPriority(f.name || f.cableName || '', q) : 0;
				return { item: f, score };
			});
			return withScores.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				const wa = this.faultSeverityWeight(a.item);
				const wb = this.faultSeverityWeight(b.item);
				if (wb !== wa) return wb - wa;
				const ta = this.parseTimeMs(a.item.start);
				const tb = this.parseTimeMs(b.item.start);
				return (tb || 0) - (ta || 0);
			}).map(x => x.item);
		},
		faultStats() {
			const list = this.displayFaults;
			let major = 0, important = 0;
			list.forEach(f => {
				const w = this.faultSeverityWeight(f);
				if (w === 3) major += 1;
				else if (w === 2) important += 1;
			});
			return { total: list.length, major, important };
		},
		tooltipLandingCables() {
			const detail = this.landingTooltip.detail;
			if (!detail || !Array.isArray(detail.cables)) return [];
			const all = detail.cables;
			// 默认选中全部关联海缆
			if (this.landingTooltip && Array.isArray(this.landingTooltip.selectedCableIds) && !this.landingTooltip.selectedCableIds.length) {
				this.landingTooltip.selectedCableIds = all.map(cb => cb.id || cb.name).filter(Boolean);
			}
			return all.slice(0, 4);
		},
		tooltipCableLandings() {
			const detail = this.cableTooltip.detail || this.cableDetail.detail;
			const list = this.normalizeLandingPoints(detail);
			if (!list || !list.length) return [];
			return list.slice(0, 4).map(lp => ({ ...lp, country: lp.country || lp.nation || lp.country_name || '' }));
		}
	},
	watch: {
		selectedOwnerships() {
			this.updateChart();
			this.landingPage = 1;
		},
		ownershipOnly() {
			// 仅影响列表筛选，不再改动地图/勾选项
			this.landingPage = 1;
			this.cablePage = 1;
		},
		landingOwnershipOnly() {
			// 仅影响地图登陆站显隐，更新列表分页保持不动
			this.updateChart();
		},
		selectedTypes() { this.updateChart(); this.landingPage = 1; },
		scopeContinent() { this.updateChart(); this.landingPage = 1; },
		scopeDistance() { this.updateChart(); this.landingPage = 1; },
		// 实时搜索时重置到第 1 页
		searchLanding() { this.landingPage = 1; },
		landingPageSize() { this.landingPage = 1; },
		landingPage(val) { this.landingPageInput = val; },
		searchCable() { this.cablePage = 1; },
		cablePageSize() { this.cablePage = 1; },
		cablePage(val) { this.cablePageInput = val; },
		overviewRegion: {
			handler() {
				this.animateOverviewChange(this.overviewMetrics);
			},
			immediate: true
		},
		landingPageItems: {
			handler(val) {
				this.prefetchLandingCountries(val);
			},
			immediate: true
		},
		showCables() { this.updateChart(); },
		showLandings() { this.updateChart(); },
		async showFaultCablesOnMap(val) {
			// 勾选“显示所有故障海缆”时，回到初始列表态并清理聚焦
			if (val) {
				// 勾选时默认隐藏登陆站名，避免画面过杂
				this.showLandingLabels = false;
				this.selectedFaultIndex = -1;
				this.selectedFault = null;
				this.faultPanelExpanded = false;
				this.focusedFaultLineIds = [];
				this.clearFocus();
				// 顺序展示“故障叠加”加载提示，避免与首次 3D 进入的 loading 互相覆盖
				await this.queueMapLoading('正在加载故障海缆叠加…');
			}
			this.updateChart();
		},
		displayFaults: {
			handler(val) {
				try {
					const list = Array.isArray(val) ? val : [];
					const prevKey = this.selectedFault ? this.faultKey(this.selectedFault) : null;
					const matchIndex = prevKey ? list.findIndex(f => this.faultKey(f) === prevKey) : -1;
					if (matchIndex >= 0) {
						this.selectedFaultIndex = matchIndex;
						this.selectedFault = list[matchIndex];
					} else {
						this.selectedFaultIndex = -1;
						this.selectedFault = null;
						this.faultPanelExpanded = false;
					}
				} catch (e) { /* noop */ }
			},
			immediate: true
		}
	},
	methods: {
		resetZoomSlider() {
			this.zoomSlider = this.defaultZoomSlider || 0;
			this.onZoomSlider();
		},
		// 等待两帧以确保 loading 先渲染到屏幕，避免空白期
		async uiFlush() {
			try {
				await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			} catch (e) { /* noop */ }
		},
			// 2D 地图底色切换：下拉选择多风格，覆盖 8 模式的 2D 视图，切换时展示简短进度提示
			async onMapTextureStyleChange(val) {
				const exists = this.mapTextureStyleOptions.some(o => o.key === val);
				this.mapTextureStyle = exists ? val : 'gray';
				if (this.isGlobe) return; // 仅 2D 生效，3D 模式无需刷新
				await this.queueMapLoading('正在切换底色（1/2：应用配色方案）…', 600);
				this.updateChart();
				// 简短补充提示，确保用户感知重绘完成
				this.mapLoading = true;
				this.mapLoadingText = '正在切换底色（2/2：重绘中）…';
				await this.uiFlush();
				setTimeout(() => { this.mapLoading = false; this.mapLoadingText = ''; }, 480);
			},
			// 3D 光效开关：控制 bloom/大气效果，切换时附带加载提示，兼容 8 模式
			async toggleGlobeGlow() {
				const action = this.globeGlowEnabled ? '关闭' : '开启';
				this.globeGlowEnabled = !this.globeGlowEnabled;
				if (!this.isGlobe) return;
				await this.queueMapLoading(`正在${action} 3D 光效（1/2：应用配置）…`, 600);
				this.updateChart();
				this.mapLoading = true;
				this.mapLoadingText = `正在${action} 3D 光效（2/2：重绘）…`;
				await this.uiFlush();
				setTimeout(() => { this.mapLoading = false; this.mapLoadingText = ''; }, 520);
			},
			// 走线光迹动效开关：适配 2D/3D、聚焦/打点/实况
			async toggleLineEffect() {
				const next = !this.lineEffectEnabled;
				const action = next ? '开启' : '关闭';
				this.lineEffectEnabled = next;
				await this.queueMapLoading(`正在${action}走线效果（1/2：应用配置）…`, 520);
				this.updateChart();
				this.mapLoading = true;
				this.mapLoadingText = `正在${action}走线效果（2/2：重绘）…`;
				await this.uiFlush();
				setTimeout(() => { this.mapLoading = false; this.mapLoadingText = ''; }, 480);
			},
			// 3D 光效风格切换：仅在 3D 模式下生效，带 Loading 提示
			async onGlobeGlowStyleChange(val) {
				const exists = this.globeGlowStyleOptions.some(o => o.key === val);
				this.globeGlowStyle = exists ? val : 'default';
				if (!this.isGlobe) return;
				await this.queueMapLoading('正在切换 3D 光效风格（1/2）…', 600);
				this.updateChart();
				this.mapLoading = true;
				this.mapLoadingText = '正在切换 3D 光效风格（2/2：重绘）…';
				await this.uiFlush();
				setTimeout(() => { this.mapLoading = false; this.mapLoadingText = ''; }, 520);
			},
			// 3D 光效亮度调节：滑条调整整体光效强度，带 Loading 提示
			async onGlobeGlowBrightnessChange(val) {
				const num = Number(val);
				const clamped = isFinite(num) ? Math.max(0.2, Math.min(2.5, num)) : 1.0;
				this.globeGlowBrightness = clamped;
				if (!this.isGlobe) return;
				await this.queueMapLoading('正在调整光效亮度（1/2）…', 500);
				this.updateChart();
				this.mapLoading = true;
				this.mapLoadingText = '正在调整光效亮度（2/2：重绘）…';
				await this.uiFlush();
				setTimeout(() => { this.mapLoading = false; this.mapLoadingText = ''; }, 480);
			},
			resetGlobeGlowBrightness() {
				const defaultValue = typeof this.defaultGlobeGlowBrightness === 'number' ? this.defaultGlobeGlowBrightness : 1.0;
				this.globeGlowBrightness = defaultValue;
				this.onGlobeGlowBrightnessChange(defaultValue);
			},
			// 概览面板的数值动画：在区域切换时平滑过渡而非瞬跳
			animateOverviewChange(nextMetrics = {}) {
				const from = { ...this.overviewDisplayMetrics };
				const to = {
					businessesTotal: Number(nextMetrics.businessesTotal) || 0,
					equityTotal: Number(nextMetrics.equityTotal) || 0,
					lengthTotal: Number(nextMetrics.lengthTotal) || 0,
					lightUpBandwidthTotal: Number(nextMetrics.lightUpBandwidthTotal) || 0,
					usingBandwidthTotal: Number(nextMetrics.usingBandwidthTotal) || 0,
					utilizationRateTotal: Number(nextMetrics.utilizationRateTotal) || 0
				};
				const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
				const raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : (cb => setTimeout(() => cb(Date.now()), 16));
				const caf = (typeof cancelAnimationFrame === 'function') ? cancelAnimationFrame : clearTimeout;
				if (this.overviewAnimFrame) caf(this.overviewAnimFrame);
				const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
				const duration = 480;
				const step = now => {
					const t = Math.min(1, (now - start) / duration);
					const k = easeOutCubic(t);
					this.overviewDisplayMetrics = {
						businessesTotal: from.businessesTotal + (to.businessesTotal - from.businessesTotal) * k,
						equityTotal: from.equityTotal + (to.equityTotal - from.equityTotal) * k,
						lengthTotal: from.lengthTotal + (to.lengthTotal - from.lengthTotal) * k,
						lightUpBandwidthTotal: from.lightUpBandwidthTotal + (to.lightUpBandwidthTotal - from.lightUpBandwidthTotal) * k,
						usingBandwidthTotal: from.usingBandwidthTotal + (to.usingBandwidthTotal - from.usingBandwidthTotal) * k,
						utilizationRateTotal: from.utilizationRateTotal + (to.utilizationRateTotal - from.utilizationRateTotal) * k
					};
					if (t < 1) {
						this.overviewAnimFrame = raf(step);
					} else {
						this.overviewAnimFrame = null;
					}
				};
				this.overviewAnimFrame = raf(step);
			},
			sleep(ms = 360) { return new Promise(resolve => setTimeout(resolve, ms)); },
			async waitModeSwitchIdle(maxWait = 12) {
				let tries = 0;
				while (this.modeSwitching && tries < maxWait) { await this.sleep(120); tries += 1; }
			},
			// 根据当前故障接口模式，返回匹配的 host（登录校验与故障接口保持同源）
			faultApiHost() {
				const mode = this.faultApiModes.find(m => m.key === this.faultApiMode);
				return mode ? mode.host : '';
			},
			// 生成控制室接口的完整基础地址（与故障接口一致）
			authBaseUrl() {
				const host = this.faultApiHost();
				return host ? `http://${host}/fault_data_url/index.php` : '/fault_data_url/index.php';
			},
			// 首次鉴权前先探测可用的故障接口 IP，确保登录接口同源
			async ensureFaultApiModeReady() {
				if (this.faultApiReachability[this.faultApiMode]) return this.faultApiMode;
				await this.autoDetectFaultApiMode();
				const ok = await this.verifyModeReachable(this.faultApiMode, { alertOnFail: false });
				return ok ? this.faultApiMode : null;
			},
			// 登录校验：若 URL 带 account 则请求用户信息；developmode 直通；否则弹窗提示跳转登录
			async ensureUserAccess() {
				const hasDevelopMode = Object.entries(this.locationParam || {}).some(([k, v]) => {
					const key = String(k || '').toLowerCase();
					const val = String(v || '').toLowerCase();
					return key === 'developmode' || val.includes('developmode');
				});
				if (hasDevelopMode) {
					// 开发演示模式：绕过登录，写入默认用户信息，保持后续 2D/3D、紧凑/大屏等流程一致
					if (!this.userInfo) this.userInfo = { admin_account: 'developmode', name: '开发免登录' };
					this.authBlocked = false;
					await this.ensureFaultApiModeReady();
					return true;
				}
				const account = this.locationParam?.account;
				if (!account) {
					this.authBlocked = true;
					this.mapLoading = false;
					this.mapLoadingText = '';
					this.promptLogin();
					return false;
				}
				await this.ensureFaultApiModeReady();
				const base = this.authBaseUrl();
				try {
					const url = `${base}/customer/dp6GetUserMessage?account=${encodeURIComponent(account)}`;
					const res = await fetch(url, { method: 'GET', credentials: 'include' });
					const data = await res.json();
					if (data && (data.admin_account || data.id)) {
						this.userInfo = data;
						this.authBlocked = false;
						return true;
					}
				} catch (e) { /* 请求失败则视为未登录 */ }
				this.authBlocked = true;
				this.mapLoading = false;
				this.mapLoadingText = '';
				this.promptLogin();
				return false;
			},
			promptLogin() {
				const base = this.authBaseUrl();
				const message = '需登录“生产信息管理系统”后使用，请在【生产信息系统-大屏系统-海缆信息】中打开海缆信息管理与展示系统。';
				const openLogin = () => this.openControlRoomLogin(base);
				if (this.$alert) {
					this.$alert(message, '登录校验', {
						confirmButtonText: '前往登录',
						customClass: 'sci-login-alert',
						callback: () => openLogin()
					});
				} else {
					alert(message);
					openLogin();
				}
			},
			openControlRoomLogin(baseUrl = '/login_url/index.php') {
				const target = `${baseUrl}`;
				window.location.href = target;
			},
			// 串行化地图 loading，防止与 3D 首次进入的模拟 loading 互相覆盖
			async queueMapLoading(text, duration = 420) {
				const maxWait = 60;
				let tries = 0;
				while (this.mapLoading && tries < maxWait) {
					await new Promise(resolve => setTimeout(resolve, 80));
					tries += 1;
				}
				this.mapLoading = true;
				this.mapLoadingText = text;
				await this.uiFlush();
				setTimeout(() => {
					if (this.mapLoadingText === text) {
						this.mapLoading = false;
						this.mapLoadingText = '';
					}
				}, duration);
			},
		// 右下角弹窗（Element UI Notification）：用于“重算并保存”等后台结果提示
		notifyToast(message, type = 'info', title = '提示') {
			try {
				if (this.$notify) {
					this.$notify({
						title,
						message,
						type,
						position: 'bottom-right',
						duration: 5000,
						customClass: 'sci-toast'
					});
				}
			} catch (e) { /* noop */ }
		},
		// 自转速度归一化：限制合理区间避免异常值放大
		normalizeAutoRotateSpeed(val) {
			const min = 0.2;
			const max = 20;
			const num = Number(val);
			if (!isFinite(num)) return 0.9;
			return Math.max(min, Math.min(max, Math.round(num * 10) / 10));
		},
		// 直接增量写入视角的自转参数，避免整图刷新
		applyAutoRotateView(speedOverride = null) {
			const targetSpeed = this.normalizeAutoRotateSpeed(speedOverride != null ? speedOverride : this.autoRotateSpeed);
			this.autoRotateSpeed = targetSpeed;
			if (this.isGlobe && this.myChart) {
				try {
					this.myChart.setOption({ globe: { viewControl: {
						autoRotate: !!this.autoRotate,
						autoRotateAfterStill: this.autoRotate ? 0.25 : 1e9,
						autoRotateSpeed: targetSpeed
					} } });
				} catch (e) { this.updateChart(); }
			} else if (this.isGlobe) {
				this.updateChart();
			}
		},
		// 自转速度滑条变更：根据最新值增量应用视角参数
		onAutoRotateSpeedChange() {
			this.applyAutoRotateView();
		},
		// 分隔条拖拽
		startDragScreenLeft(e) {
			try {
				const screen = this.$el.querySelector('.screen');
				if (!screen || !screen.getBoundingClientRect) return;
				const rect = screen.getBoundingClientRect();
				const minLeft = 12; // 左列最小百分比
				const minCenter = 35; // 中列最小百分比
				const minRight = 20; // 右列最小百分比
				const onMove = (ev) => {
					const x = ev.clientX;
					// 只调整左/中，不影响右；边界：left >= minLeft，center >= minCenter
					const maxLeft = 100 - this.rightColPct - minCenter;
					let pctLeft = ((x - rect.left - 10) / (rect.width - 20)) * 100; // 扣除左右 padding 10
					pctLeft = Math.max(minLeft, Math.min(maxLeft, pctLeft));
					this.leftColPct = Math.round(pctLeft * 10) / 10;
					this.centerColPct = Math.round((100 - this.leftColPct - this.rightColPct) * 10) / 10;
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try { localStorage.setItem('dp6.layout.screenCols', JSON.stringify({ l: this.leftColPct, c: this.centerColPct, r: this.rightColPct })); } catch (e) { /* noop */ }
					this.$nextTick(() => this.refreshMapAfterLayout());
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (err) { /* noop */ }
		},
		startDragScreenRight(e) {
			try {
				const screen = this.$el.querySelector('.screen');
				if (!screen || !screen.getBoundingClientRect) return;
				const rect = screen.getBoundingClientRect();
				const minLeft = 12;
				const minCenter = 35;
				const minRight = 20;
				const onMove = (ev) => {
					const x = ev.clientX;
					// 只调整右/中，不影响左；边界：right >= minRight，center >= minCenter
					const maxRight = 100 - this.leftColPct - minCenter;
					let pctRight = ((rect.right - x - 10) / (rect.width - 20)) * 100; // 从右侧计算，扣 padding
					pctRight = Math.max(minRight, Math.min(maxRight, pctRight));
					this.rightColPct = Math.round(pctRight * 10) / 10;
					this.centerColPct = Math.round((100 - this.leftColPct - this.rightColPct) * 10) / 10;
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try { localStorage.setItem('dp6.layout.screenCols', JSON.stringify({ l: this.leftColPct, c: this.centerColPct, r: this.rightColPct })); } catch (e) { /* noop */ }
					this.$nextTick(() => this.refreshMapAfterLayout());
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (err) { /* noop */ }
		},
		// 实况开关：每 5 分钟自动刷新故障数据
		// 初学者提示：开启后每 5 分钟自动从接口拉取故障数据，并在界面上显示刷新倒计时与处理提示文本
		toggleRealtime() {
			if (this.realtimeEnabled) {
				this.realtimeEnabled = false;
				if (this.realtimeTimerId) { try { clearInterval(this.realtimeTimerId); } catch (e) { } this.realtimeTimerId = null; }
				if (this.realtimeCountdownTimerId) { try { clearInterval(this.realtimeCountdownTimerId); } catch (e) { } this.realtimeCountdownTimerId = null; }
				this.realtimeMessage = '实况已关闭';
			} else {
				this.realtimeEnabled = true;
				// 立即刷新一次
				this.loadFaults();
				// 每 5 分钟刷新
				if (this.realtimeTimerId) { try { clearInterval(this.realtimeTimerId); } catch (e) { } }
				this.realtimeTimerId = setInterval(() => { this.loadFaults(); }, 5 * 60 * 1000);
				// 启动倒计时：300 秒
				this.realtimeCountdown = 300;
				if (this.realtimeCountdownTimerId) { try { clearInterval(this.realtimeCountdownTimerId); } catch (e) { } }
				this.realtimeCountdownTimerId = setInterval(() => {
					if (!this.realtimeEnabled) return;
					this.realtimeCountdown = Math.max(0, (this.realtimeCountdown || 0) - 1);
					if (this.realtimeCountdown <= 0) this.realtimeCountdown = 300;
				}, 1000);
				this.realtimeMessage = '实况已开启：每 5 分钟自动刷新故障数据';
			}
		},
		startDragV(e) {
			try {
				const grid = this.$refs.listsGrid;
				if (!grid || !grid.getBoundingClientRect) return;
				const rect = grid.getBoundingClientRect();
				const onMove = (ev) => {
					const x = ev.clientX;
					const pct = ((x - rect.left) / rect.width) * 100;
					const clamped = Math.max(30, Math.min(70, pct));
					this.leftPanePct = Math.round(clamped);
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try { localStorage.setItem('dp6.layout.leftPanePct', String(this.leftPanePct)); } catch (e) { /* noop */ }
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (err) { /* noop */ }
		},
		startDragH(e) {
			try {
				const grid = this.$refs.listsGrid;
				if (!grid || !grid.getBoundingClientRect) return;
				const rect = grid.getBoundingClientRect();
				const onMove = (ev) => {
					const y = ev.clientY;
					const pct = ((y - rect.top) / rect.height) * 100;
					const clamped = Math.max(35, Math.min(85, pct));
					this.topHeightPct = Math.round(clamped);
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try { localStorage.setItem('dp6.layout.topHeightPct', String(this.topHeightPct)); } catch (e) { /* noop */ }
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (err) { /* noop */ }
		},
		// 打开/关闭浮动列表面板
		openFloating(type) {
			try {
				const vw = window.innerWidth || 1600;
				const vh = window.innerHeight || 900;
				const w = Math.min(980, Math.max(420, Math.round(vw * 0.6)));
				const h = Math.min(720, Math.max(300, Math.round(vh * 0.6)));
				const x = Math.max(12, Math.round((vw - w) / 2));
				const y = Math.max(12, Math.round((vh - h) / 2));
				const key = `dp6.fp.${type}`;
				let saved = null;
				try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { saved = null; }
				const clampRect = (geom) => {
					if (!geom) return null;
					let nx = Math.max(0, Math.min(vw - (geom.w || w), Number(geom.x) || x));
					let ny = Math.max(0, Math.min(vh - (geom.h || h), Number(geom.y) || y));
					let nw = Math.max(360, Math.min(vw - nx - 6, Number(geom.w) || w));
					let nh = Math.max(260, Math.min(vh - ny - 6, Number(geom.h) || h));
					return { x: nx, y: ny, w: nw, h: nh };
				};
				const rect = clampRect(saved) || { x, y, w, h };
				this.floatingPanel = { active: true, type, x: rect.x, y: rect.y, w: rect.w, h: rect.h, minW: 360, minH: 260, dragging: false, resizing: false, _dx: 0, _dy: 0 };
			} catch (e) { /* noop */ }
		},
		closeFloating() {
			this.floatingPanel.active = false;
			this.floatingPanel.type = null;
		},
		startFpDrag(e) {
			try {
				if (!this.floatingPanel.active) return;
				const startX = e.clientX, startY = e.clientY;
				const sx = this.floatingPanel.x, sy = this.floatingPanel.y;
				const onMove = (ev) => {
					const dx = ev.clientX - startX;
					const dy = ev.clientY - startY;
					let nx = sx + dx;
					let ny = sy + dy;
					const vw = window.innerWidth || 1600;
					const vh = window.innerHeight || 900;
					nx = Math.max(0, Math.min(vw - this.floatingPanel.w, nx));
					ny = Math.max(0, Math.min(vh - this.floatingPanel.h, ny));
					this.floatingPanel.x = nx;
					this.floatingPanel.y = ny;
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try {
						const key = `dp6.fp.${this.floatingPanel.type}`;
						localStorage.setItem(key, JSON.stringify({ x: this.floatingPanel.x, y: this.floatingPanel.y, w: this.floatingPanel.w, h: this.floatingPanel.h }));
					} catch (e) { /* noop */ }
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (e2) { /* noop */ }
		},
		startFpResize(e) {
			try {
				if (!this.floatingPanel.active) return;
				const startX = e.clientX, startY = e.clientY;
				const sw = this.floatingPanel.w, sh = this.floatingPanel.h;
				const onMove = (ev) => {
					const dx = ev.clientX - startX;
					const dy = ev.clientY - startY;
					let nw = sw + dx;
					let nh = sh + dy;
					nw = Math.max(this.floatingPanel.minW, nw);
					nh = Math.max(this.floatingPanel.minH, nh);
					const vw = window.innerWidth || 1600;
					const vh = window.innerHeight || 900;
					nw = Math.min(nw, vw - this.floatingPanel.x - 6);
					nh = Math.min(nh, vh - this.floatingPanel.y - 6);
					this.floatingPanel.w = nw;
					this.floatingPanel.h = nh;
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try {
						const key = `dp6.fp.${this.floatingPanel.type}`;
						localStorage.setItem(key, JSON.stringify({ x: this.floatingPanel.x, y: this.floatingPanel.y, w: this.floatingPanel.w, h: this.floatingPanel.h }));
					} catch (e) { /* noop */ }
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (e2) { /* noop */ }
		},
		startCompactResize(e) {
			try {
				const startX = e.clientX;
				const sw = Number(this.compactPanelWidth) || 420;
				const minW = 360;
				const maxW = Math.max(minW + 60, Math.round((window.innerWidth || 1600) * 0.6));
				const onMove = (ev) => {
					const dx = ev.clientX - startX;
					let nw = sw + dx;
					nw = Math.max(minW, Math.min(maxW, nw));
					this.compactPanelWidth = Math.round(nw);
				};
				const onUp = () => {
					window.removeEventListener('mousemove', onMove);
					window.removeEventListener('mouseup', onUp);
					try { localStorage.setItem('dp6.layout.compactPanelWidth', String(this.compactPanelWidth)); } catch (e) { /* noop */ }
				};
				window.addEventListener('mousemove', onMove);
				window.addEventListener('mouseup', onUp);
			} catch (err) { /* noop */ }
		},
		copyText(text, label = '') {
			try {
				const s = String(text || '');
				if (!s) return;
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(s).catch(() => { });
					return;
				}
				const ta = document.createElement('textarea');
				ta.value = s;
				ta.style.position = 'fixed';
				ta.style.left = '-1000px';
				ta.style.top = '-1000px';
				document.body.appendChild(ta);
				ta.focus(); ta.select();
				try { document.execCommand('copy'); } catch (e) { }
				document.body.removeChild(ta);
			} catch (e) { /* noop */ }
		},
		// 括号匹配优先级：() 或（） 内匹配得分 2，普通包含得分 1，不匹配 0
		searchPriority(text, q) {
			try {
				const s = String(text || '').toLowerCase();
				const k = String(q || '').toLowerCase();
				if (!k || !s.includes(k)) return 0;
				// 提取括号内容并检查匹配
				const innerMatches = [];
				const pushMatches = (open, close) => {
					let i = 0;
					while (i < s.length) {
						const a = s.indexOf(open, i);
						if (a < 0) break;
						const b = s.indexOf(close, a + 1);
						if (b < 0) break;
						const inner = s.slice(a + 1, b);
						innerMatches.push(inner);
						i = b + 1;
					}
				};
				pushMatches('(', ')');
				pushMatches('（', '）');
				if (innerMatches.some(m => m.includes(k))) return 2;
				return 1;
			} catch (e) { return 0; }
		},
		buildInitials(text) {
			const raw = String(text || '');
			const alnum = raw.replace(/[^a-z0-9]/gi, '');
			if (alnum && alnum.length <= 8) return alnum.toLowerCase();
			const tokens = raw.split(/[^a-z0-9]+/i).filter(Boolean);
			return tokens.map(t => t[0]).join('').toLowerCase();
		},
		matchInitials(text, q) {
			if (!q) return false;
			const initials = this.buildInitials(text);
			return initials && initials.includes(String(q).toLowerCase());
		},
		normalizeLon(lon) {
			const x = Number(lon);
			if (!isFinite(x)) return x;
			return x > 180 ? x - 360 : x;
		},
		continentByLonLat(lon, lat) {
			const x = this.normalizeLon(lon);
			const y = Number(lat);
			if (!isFinite(x) || !isFinite(y)) return null;
			if (y <= -60) return '南极洲';
			const inBox = (xmin, xmax, ymin, ymax) => (x >= xmin && x <= xmax && y >= ymin && y <= ymax);
			if (inBox(-170, -25, 5, 83)) return '北美洲';
			if (inBox(-82, -34, -56, 12)) return '南美洲';
			if (inBox(-25, 65, 35, 72)) return '欧洲';
			if (inBox(25, 62, 12, 38)) return '亚洲';
			if (inBox(-20, 52, -35, 37)) return '非洲';
			if (inBox(26, 180, -10, 85)) return '亚洲';
			if (inBox(110, 180, -50, -10)) return '大洋洲';
			return (x >= -180 && x <= -25) ? '北美洲' : (x >= -82 && x <= -34) ? '南美洲' : (x >= 26 && x <= 180) ? '亚洲' : '欧洲';
		},
		macroRegionByLonLat(lon, lat) {
			const c = this.continentByLonLat(lon, lat);
			if (!c) return 'OTHER';
			if (c === '欧洲' || c === '非洲') return 'EMEA';
			if (c === '亚洲' || c === '大洋洲') return 'APAC';
			if (c === '北美洲' || c === '南美洲') return 'AMER';
			return 'OTHER';
		},
		continentByCountry(country) {
			const s = String(country || '').trim();
			const map = {
				'中国': '亚洲', '中国台湾省': '亚洲', '中国香港': '亚洲', '中国澳门': '亚洲', '日本': '亚洲', '韩国': '亚洲', '朝鲜': '亚洲', '蒙古': '亚洲',
				'印度': '亚洲', '巴基斯坦': '亚洲', '孟加拉国': '亚洲', '斯里兰卡': '亚洲', '尼泊尔': '亚洲', '不丹': '亚洲', '缅甸': '亚洲', '泰国': '亚洲', '老挝': '亚洲', '柬埔寨': '亚洲', '越南': '亚洲', '马来西亚': '亚洲', '新加坡': '亚洲', '印度尼西亚': '亚洲', '菲律宾': '亚洲', '文莱': '亚洲', '东帝汶': '亚洲',
				'澳大利亚': '大洋洲', '新西兰': '大洋洲',
				'美国': '北美洲', '加拿大': '北美洲', '墨西哥': '北美洲',
				'巴西': '南美洲', '阿根廷': '南美洲', '智利': '南美洲', '秘鲁': '南美洲', '哥伦比亚': '南美洲', '委内瑞拉': '南美洲', '乌拉圭': '南美洲', '巴拉圭': '南美洲', '玻利维亚': '南美洲', '厄瓜多尔': '南美洲',
				'英国': '欧洲', '德国': '欧洲', '法国': '欧洲', '意大利': '欧洲', '西班牙': '欧洲', '葡萄牙': '欧洲', '荷兰': '欧洲', '比利时': '欧洲', '瑞士': '欧洲', '奥地利': '欧洲', '瑞典': '欧洲', '挪威': '欧洲', '丹麦': '欧洲', '芬兰': '欧洲', '俄罗斯': '欧洲', '乌克兰': '欧洲', '波兰': '欧洲', '捷克': '欧洲', '匈牙利': '欧洲', '罗马尼亚': '欧洲', '保加利亚': '欧洲', '希腊': '欧洲', '土耳其': '欧洲',
				'沙特阿拉伯': '亚洲', '阿联酋': '亚洲', '卡塔尔': '亚洲', '巴林': '亚洲', '科威特': '亚洲', '阿曼': '亚洲', '伊朗': '亚洲', '伊拉克': '亚洲', '以色列': '亚洲', '巴勒斯坦': '亚洲', '约旦': '亚洲', '黎巴嫩': '亚洲', '叙利亚': '亚洲',
				'埃及': '非洲', '摩洛哥': '非洲', '阿尔及利亚': '非洲', '突尼斯': '非洲', '利比亚': '非洲', '也门': '亚洲', '索马里': '非洲', '吉布提': '非洲', '马尔代夫': '亚洲', '苏丹': '非洲', '刚果（金）': '非洲', '刚果（布）': '非洲',
				'南非': '非洲', '尼日利亚': '非洲', '肯尼亚': '非洲', '埃塞俄比亚': '非洲', '坦桑尼亚': '非洲', '加纳': '非洲', '塞内加尔': '非洲', '科特迪瓦': '非洲', '安哥拉': '非洲', '莫桑比克': '非洲', '津巴布韦': '非洲', '赞比亚': '非洲', '博茨瓦纳': '非洲', '纳米比亚': '非洲', '毛里求斯': '非洲', '塞舌尔': '非洲'
			};
			return map[s] || null;
		},
		macroRegionByCountry(country) {
			const c = this.continentByCountry(country);
			if (!c) return null;
			if (c === '欧洲' || c === '非洲') return 'EMEA';
			if (c === '亚洲' || c === '大洋洲') return 'APAC';
			if (c === '北美洲' || c === '南美洲') return 'AMER';
			return null;
		},
		directionCardinalByLonLat(lon, lat) {
			const x = this.normalizeLon(lon);
			const y = Number(lat);
			if (!isFinite(x) || !isFinite(y)) return null;
			const cx = 105, cy = 35;
			const dx = x - cx, dy = y - cy;
			const ang = Math.atan2(dy, dx) * 180 / Math.PI;
			const a = (ang + 360) % 360;
			if (a >= 337.5 || a < 22.5) return '东向';
			if (a >= 22.5 && a < 67.5) return '东北向';
			if (a >= 67.5 && a < 112.5) return '北向';
			if (a >= 112.5 && a < 157.5) return '西北向';
			if (a >= 157.5 && a < 202.5) return '西向';
			if (a >= 202.5 && a < 247.5) return '西南向';
			if (a >= 247.5 && a < 292.5) return '南向';
			return '东南向';
		},
		directionLabelForContinents(a, b) {
			const pair = new Set([a, b].filter(Boolean));
			if (pair.size <= 1) return '区域互联';
			const s = [...pair].sort().join('-');
			const dict = {
				'亚洲-北美洲': '跨太平洋',
				'亚洲-欧洲': '亚欧互联',
				'亚洲-非洲': '亚非互联',
				'欧洲-北美洲': '跨大西洋',
				'北美洲-南美洲': '美洲互联',
				'欧洲-非洲': '欧非互联',
				'亚洲-大洋洲': '亚澳互联'
			};
			return dict[s] || '跨洲互联';
		},
		deriveMacroRegionFromCoords(coords) {
			const counts = { APAC: 0, EMEA: 0, AMER: 0, OTHER: 0 };
			const arr = Array.isArray(coords) ? coords.filter(p => Array.isArray(p) && p.length >= 2) : [];
			const step = Math.max(1, Math.floor(arr.length / 20));
			for (let i = 0; i < arr.length; i += step) {
				const r = this.macroRegionByLonLat(arr[i][0], arr[i][1]);
				counts[r] = (counts[r] || 0) + 1;
			}
			const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
			return (entries[0] && entries[0][0]) || 'OTHER';
		},
		computeContinentFor(country, coord) {
			const byCountry = this.continentByCountry(country);
			if (byCountry) return byCountry;
			const c = Array.isArray(coord) && coord.length >= 2 ? this.continentByLonLat(coord[0], coord[1]) : null;
			return c || null;
		},
		computeMacroRegionFor(country, coord) {
			const byCountry = this.macroRegionByCountry(country);
			if (byCountry) return byCountry;
			const c = Array.isArray(coord) && coord.length >= 2 ? this.macroRegionByLonLat(coord[0], coord[1]) : null;
			return c || 'OTHER';
		},
		computeDirectionFor(coord) {
			if (!Array.isArray(coord) || coord.length < 2) return null;
			return this.directionCardinalByLonLat(coord[0], coord[1]);
		},
		updateCableEnrichment(id) {
			try {
				const detail = this.cableDetails[id] || null;
				const landings = this.normalizeLandingPoints(detail);
				const continents = new Set();
				const macroSet = new Set();
				landings.forEach(lp => {
					const lpObj = lp && lp.id ? (this.landingPoints.find(p => p.id === lp.id) || null) : null;
					const coord = lpObj && lpObj.coords ? lpObj.coords : null;
					const cont = this.computeContinentFor(lpObj?.country || lp?.country, coord);
					if (cont) continents.add(cont);
					const mr = this.computeMacroRegionFor(lpObj?.country || lp?.country, coord);
					if (mr) macroSet.add(mr);
				});
				let direction = '区域互联';
				const arrC = [...continents];
				if (arrC.length >= 2) direction = this.directionLabelForContinents(arrC[0], arrC[1]);
				if (arrC.length > 2) direction = '多洲互联';
				const macro = [...macroSet];
				const lines = this.cableLines.filter(l => l.id === id);
				lines.forEach(l => {
					const region = macro.length ? macro[0] : this.deriveMacroRegionFromCoords(l.coords);
					this.$set(l, 'continents', arrC);
					this.$set(l, 'direction', direction);
					this.$set(l, 'continent', region);
				});
			} catch (e) { }
		},
		translateCountryToZh(val) {
			if (!val) return '';
			const s = String(val).trim();
			const dict = {
				'China': '中国', 'PRC': '中国', 'Mainland China': '中国大陆', 'Taiwan': '中国台湾省', 'Hong Kong': '中国香港', 'Macau': '中国澳门',
				'United States': '美国', 'USA': '美国', 'U.S.': '美国', 'America': '美国',
				'United Kingdom': '英国', 'UK': '英国', 'Great Britain': '英国',
				'Germany': '德国', 'France': '法国', 'Italy': '意大利', 'Spain': '西班牙', 'Portugal': '葡萄牙', 'Netherlands': '荷兰', 'Belgium': '比利时', 'Switzerland': '瑞士', 'Austria': '奥地利',
				'Sweden': '瑞典', 'Norway': '挪威', 'Denmark': '丹麦', 'Finland': '芬兰', 'Russia': '俄罗斯', 'Ukraine': '乌克兰', 'Poland': '波兰',
				'Czech Republic': '捷克', 'Hungary': '匈牙利', 'Romania': '罗马尼亚', 'Bulgaria': '保加利亚', 'Greece': '希腊', 'Turkey': '土耳其',
				'Japan': '日本', 'South Korea': '韩国', 'Korea, Republic of': '韩国', 'North Korea': '朝鲜', 'Mongolia': '蒙古',
				'India': '印度', 'Pakistan': '巴基斯坦', 'Bangladesh': '孟加拉国', 'Sri Lanka': '斯里兰卡', 'Nepal': '尼泊尔', 'Bhutan': '不丹',
				'Myanmar': '缅甸', 'Thailand': '泰国', 'Laos': '老挝', 'Cambodia': '柬埔寨', 'Vietnam': '越南',
				'Malaysia': '马来西亚', 'Singapore': '新加坡', 'Indonesia': '印度尼西亚', 'Philippines': '菲律宾', 'Brunei': '文莱', 'Timor-Leste': '东帝汶',
				'Australia': '澳大利亚', 'New Zealand': '新西兰', 'Canada': '加拿大', 'Mexico': '墨西哥',
				'Brazil': '巴西', 'Argentina': '阿根廷', 'Chile': '智利', 'Peru': '秘鲁', 'Colombia': '哥伦比亚', 'Venezuela': '委内瑞拉', 'Uruguay': '乌拉圭', 'Paraguay': '巴拉圭', 'Bolivia': '玻利维亚', 'Ecuador': '厄瓜多尔',
				'Panama': '巴拿马', 'Costa Rica': '哥斯达黎加', 'El Salvador': '萨尔瓦多', 'Guatemala': '危地马拉', 'Honduras': '洪都拉斯', 'Nicaragua': '尼加拉瓜',
				'Cuba': '古巴', 'Dominican Republic': '多米尼加', 'Haiti': '海地', 'Jamaica': '牙买加', 'Bahamas': '巴哈马', 'Trinidad and Tobago': '特立尼达和多巴哥',
				'Saudi Arabia': '沙特阿拉伯', 'United Arab Emirates': '阿联酋', 'UAE': '阿联酋', 'Qatar': '卡塔尔', 'Bahrain': '巴林', 'Kuwait': '科威特', 'Oman': '阿曼',
				'Iran': '伊朗', 'Iraq': '伊拉克', 'Israel': '以色列', 'Palestine': '巴勒斯坦', 'Jordan': '约旦', 'Lebanon': '黎巴嫩', 'Syria': '叙利亚', 'Egypt': '埃及', 'Madagascar': '马达加斯加', 'Comoros': '科摩罗', 'Gabon': '加蓬',
				'Morocco': '摩洛哥', 'Algeria': '阿尔及利亚', 'Tunisia': '突尼斯', 'Libya': '利比亚', 'Yemen': '也门', 'Somalia': '索马里', 'Djibouti': '吉布提', 'Maldives': '马尔代夫', 'Sudan': '苏丹', 'Congo, Rep.': '刚果（金）', 'Congo, Dem. Rep.': '刚果（布）',
				'South Africa': '南非', 'Nigeria': '尼日利亚', 'Kenya': '肯尼亚', 'Ethiopia': '埃塞俄比亚', 'Tanzania': '坦桑尼亚', 'Ghana': '加纳', 'Senegal': '塞内加尔', 'Cote d\'Ivoire': '科特迪瓦', 'Côte d\'Ivoire': '科特迪瓦', 'Ivory Coast': '科特迪瓦',
				'Angola': '安哥拉', 'Mozambique': '莫桑比克', 'Zimbabwe': '津巴布韦', 'Zambia': '赞比亚', 'Botswana': '博茨瓦纳', 'Namibia': '纳米比亚', 'Mauritius': '毛里求斯', 'Seychelles': '塞舌尔'
			};
			return dict[s] || s;
		},
		translateCityToZh(val) {
			if (!val) return '';
			const s = String(val).trim();
			const dict = {
				'Abidjan': '阿比让'
			};
			return dict[s] || s;
		},
		translateEntityToZh(name) {
			if (!name) return '';
			const s = String(name).trim();
			const lc = s.toLowerCase();
			const dict = {
				// 运营商（Owners）
				'china mobile': '中国移动',
				'china telecom': '中国电信',
				'china unicom': '中国联通',
				'china broadnet': '中国广电',
				'ctg': '中国电信集团',
				'telecom egypt': '埃及电信',
				'etisalat': '阿联酋电信',
				'du': '阿联酋电信du',
				'ooredoo': '卡塔尔电信',
				'bharti airtel': '巴蒂电信',
				'airtel': '巴蒂电信',
				'google': '谷歌',
				'meta': 'Meta',
				'facebook': 'Meta',
				'microsoft': '微软',
				'amazon': '亚马逊',
				'ntt': '日本电信电话公司',
				'kddi': '日本KDDI',
				'softbank': '软银',
				'telstra': '澳大利亚电信',
				'spark': '新西兰电信',
				'verizon': '威瑞森',
				'at&t': '美国电话电报公司',
				'lumen': '路曼科技',
				'centurylink': '世纪互联',
				'tata communications': '塔塔通信',
				'orange': '法国电信',
				'telefonica': '西班牙电信',
				'vodafone': '沃达丰',
				'bt': '英国电信',
				'deutsche telekom': '德国电信',
				'singtel': '新加坡电信',
				'm1': '新加坡M1',
				'starhub': '星和',
				'pldt': '菲律宾长途电话公司',
				'globe telecom': '菲律宾环球电信',
				'jio': '印度信实Jio',
				'reliance jio': '印度信实Jio',
				'sri lanka telecom': '斯里兰卡电信',
				'saudi telecom company': '沙特电信',
				'stc': '沙特电信',
				'telekom malaysia': '马来西亚电信',
				'indosat': '印尼Indosat',
				'telkom indonesia': '印尼电信',
				'vodacom': '南非沃达康',
				'mtn': '南非MTN',
				'pccw': '电讯盈科',
				'hkt': '香港电讯',
				'hkbn': '香港宽频',
				'bsnl': '印度国家电信',
				'zain': '科威特Zain',
				// 供应商（Suppliers）
				'subcom': '昇康',
				'nec': '日本电气',
				'nokia': '诺基亚',
				'alcatel submarine networks': '阿尔卡特海底网络',
				'asn': '阿尔卡特海底网络',
				'hmn tech': '亨通海洋',
				'huawei marine': '华为海洋',
				'prysmian': '普睿司曼',
				'furukawa': '古河电工',
				'hengtong': '亨通',
				'ztt': '中天科技'
			};
			return dict[lc] || s;
		},
		translateEntities(val, lang = 'zh') {
			if (val == null) return '-';
			const joinZh = '、';
			const joinEn = ', ';
			const toArr = (v) => {
				if (Array.isArray(v)) return v;
				const s = String(v).trim();
				if (!s) return [];
				return s.split(/[;,\/、]+/).map(t => t.trim()).filter(Boolean);
			};
			const arr = toArr(val);
			if (!arr.length) return '-';
			if (lang === 'en') return arr.join(joinEn);
			const zhArr = arr.map(t => this.translateEntityToZh(this.normalizeText(t)));
			return zhArr.join(joinZh);
		},
		translateNameToZh(val) {
			if (!val) return '';
			let s = this.normalizeText(String(val).trim());
			// 常见地名/国家内嵌翻译（可按需扩充）
			s = s.replace(/\bAbidjan\b/g, '阿比让');
			s = s.replace(/Côte d'Ivoire|Cote d'Ivoire|Ivory Coast/gi, '科特迪瓦');
			s = s.replace(/Hong Kong/gi, '中国香港');
			s = s.replace(/Macau/gi, '中国澳门');
			s = s.replace(/Taiwan/gi, '中国台湾省');
			s = s.replace(/Mainland China|China/gi, '中国');
			return s;
		},
		// 展示占位
		safeVal(val, placeholder = '暂无') {
			if (val === 0) return 0;
			const s = (val == null) ? '' : String(val).trim();
			return s ? s : placeholder;
		},
		parseTimeMs(ts) {
			if (!ts) return null;
			const raw = String(ts).trim();
			const parsed = Date.parse(raw);
			if (!Number.isNaN(parsed)) return parsed;
			const fallback = Date.parse(raw.replace(/-/g, '/'));
			return Number.isNaN(fallback) ? null : fallback;
		},
		formatDuration(ms) {
			if (ms == null || !isFinite(ms) || ms < 0) return '-';
			const totalSec = Math.floor(ms / 1000);
			const sec = totalSec % 60;
			const min = Math.floor(totalSec / 60) % 60;
			const hour = Math.floor(totalSec / 3600) % 24;
			const day = Math.floor(totalSec / 86400);
			const pad = (n) => String(n).padStart(2, '0');
			if (day > 0) return `${day}天 ${pad(hour)}:${pad(min)}:${pad(sec)}`;
			return `${pad(hour)}:${pad(min)}:${pad(sec)}`;
		},
		liveDuration(f) {
			if (!f) return '-';
			const start = this.parseTimeMs(f.start);
			if (!start) return '-';
			const end = this.parseTimeMs(f.end) || this.nowTs;
			const ms = Math.max(0, end - start);
			return this.formatDuration(ms);
		},
		faultSeverityWeight(f) {
			const major = f && f.isMajor && String(f.isMajor).toLowerCase() !== '否';
			const important = f && (String(f.level || f.importance || '').match(/重|important|high/i));
			if (major) return 3;
			if (important) return 2;
			return 1;
		},
		faultSeverityLabel(f) {
			const w = this.faultSeverityWeight(f);
			if (w === 3) return '重大';
			if (w === 2) return '重要';
			return '';
		},
		faultSeverityClass(f) {
			const w = this.faultSeverityWeight(f);
			if (w === 3) return 'major';
			if (w === 2) return 'important';
			return '';
		},
		faultTitle(f) {
			if (!f) return '故障';
			return this.safeVal(f.cableName || f.name || '故障');
		},
		// 故障左右布局选择
		selectFault(f, i) {
			this.cancelFaultEdit();
			this.selectedFaultIndex = i;
			this.selectedFault = f || null;
			this.faultPanelExpanded = !!f;
			this.showFaultCablesOnMap = false;
			this.faultEditState.picking = false;
			const coordStr = f ? (f.pointCoord1 || f.pointCoord2 || f.pointCoord3 || '') : '';
			this.setFaultPointMarkerFromCoord(this.displayCoordFromStr(coordStr));
			this.scrollFaultIntoView(i);
			// 点击故障后尝试在地图上聚焦对应海缆
			this.$nextTick(() => this.focusFaultOnMap(f));
		},
		parseFaultCableNames(raw) {
			if (!raw) return [];
			const text = String(raw);
			// 用中英文逗号/顿号/分号/换行分割，并移除括号中的中文噪声
			const cleaned = text.replace(/[()（）\[\]]/g, ' ');
			const parts = cleaned.split(/[，,、;；\n]+/).map(s => s.trim()).filter(Boolean);
			// 仅保留包含英文字母/数字/空格/连字符的片段，便于匹配英文海缆名
			return parts.filter(p => /[a-zA-Z0-9]/.test(p)).map(p => p.replace(/\s+/g, ' ').trim());
		},
		findLineByNameFragment(nameFrag) {
			if (!nameFrag) return null;
			const target = nameFrag.toLowerCase();
			const candidates = [...this.withMetrics, ...this.cableLines, ...this.filteredCablesMap];
			const scored = candidates.map(l => {
				const nm = this.normalizeText(l.name || '').toLowerCase();
				const cid = String(l.id || '').toLowerCase();
				const fid = String(l.feature_id || '').toLowerCase();
				let score = 0;
				if (nm === target) score = 5;
				else if (nm.includes(target) || target.includes(nm)) score = 4;
				else if (cid && cid === target) score = 4.5;
				else if (fid && fid === target) score = 4.5;
				// 低优先模糊：拆成单词交集
				const words = target.split(/\s+/).filter(Boolean);
				const hitWords = words.filter(w => nm.includes(w)).length;
				if (hitWords) score = Math.max(score, 2 + hitWords * 0.5);
				return { l, score };
			}).filter(x => x.score > 0.5);
			if (!scored.length) return null;
			scored.sort((a, b) => b.score - a.score);
			return scored[0].l;
		},
		focusFaultOnMap(f) {
			try {
				if (!f || !this.myChart) return;
				this.showLandings = true;
				this.showLandingLabels = true;
				const lines = this.resolveFaultLines(f) || [];
				this.focusMode = 'fault';
				this.focusedFaultLineIds = lines.map(l => l.feature_id || l.id || l.name).filter(Boolean);
				this.focusedCableId = null;
				this.focusedFeatureId = null;
				this.focusedLanding = null;
				this.landingTooltip.selectedCableIds = [];
				let targetCoord = [120, 20];
				let targetZoom = this.geoZoom || 1.8;
				const allCoords = [];
				const collectSegs = (l) => {
					const segs = this.isGlobe
						? ((Array.isArray(l.segments_globe) && l.segments_globe.length) ? l.segments_globe : (Array.isArray(l.coords_globe) ? [l.coords_globe] : []))
						: ((Array.isArray(l.segments) && l.segments.length) ? l.segments : this.splitLineSegments(l.coords));
					segs.forEach(seg => { if (Array.isArray(seg)) allCoords.push(...seg); });
				};
				lines.forEach(collectSegs);
				if (allCoords.length) {
					const xs = allCoords.map(c => Number(c[0])).filter(isFinite);
					const ys = allCoords.map(c => Number(c[1])).filter(isFinite);
					if (xs.length && ys.length) {
						const minX = Math.min(...xs), maxX = Math.max(...xs);
						const minY = Math.min(...ys), maxY = Math.max(...ys);
						const cx = (minX + maxX) / 2;
						const cy = (minY + maxY) / 2;
						const spanX = Math.max(1, Math.abs(maxX - minX));
						const spanY = Math.max(1, Math.abs(maxY - minY));
						const span = Math.max(spanX, spanY);
						targetCoord = [cx, cy];
						targetZoom = span > 120 ? 1.8 : span > 60 ? 2.2 : span > 20 ? 2.6 : 3.2;
					}
				}
				// 若无故障定位坐标，依旧进入聚焦模式并回到亚太中心
				this.focusTargetCoord = targetCoord;
				if (this.isGlobe) {
					try { this.myChart.setOption({ globe: { viewControl: { targetCoord } } }); } catch (e) { /* noop */ }
				} else {
					this.geoZoom = targetZoom;
					this.myChart.setOption({ geo: { center: targetCoord, zoom: this.geoZoom } });
				}
				this.updateChart();
				this.statesToSlider();
			} catch (e) { console.warn('故障聚焦失败', e); }
		},
		scrollFaultIntoView(i) {
			this.$nextTick(() => {
				try {
					const list = this.$refs.faultList;
					const itemRef = this.$refs['faultItem-' + i];
					const item = Array.isArray(itemRef) ? itemRef[0] : itemRef;
					if (list && item && typeof item.offsetTop === 'number') {
						list.scrollTop = item.offsetTop;
					}
				} catch (e) { /* noop */ }
			});
		},
		// 故障列表展开逻辑
		faultKey(f, i = null) {
			const wo = (f && f.workOrder) ? String(f.workOrder).trim() : '';
			const name = (f && f.name) ? String(f.name).trim() : '';
			const start = (f && f.start) ? String(f.start).trim() : '';
			const base = wo || `${name}|${start}`;
			return i === null ? base : `${base}|${i}`;
		},
		isFaultExpanded(f, i) {
			const k = this.faultKey(f, i);
			return !!this.faultExpand[k];
		},
		toggleFaultDetail(i) {
			if (this.selectedFaultIndex === i) {
				this.selectedFaultIndex = -1;
				this.selectedFault = null;
				this.faultPanelExpanded = false;
				this.faultOverlayMode = false;
			} else {
				this.selectedFaultIndex = i;
				this.selectedFault = this.displayFaults[i];
				this.faultPanelExpanded = true;
				// 拖动面板与紧凑模式均默认内联展示，只有用户点击“展开到大窗”才进入浮层
				this.faultOverlayMode = false;
				this.showFaultCablesOnMap = false;
				// 吸顶
				this.$nextTick(() => {
					const el = this.$refs['faultItem-' + i];
					const node = Array.isArray(el) ? el[0] : el;
					if (node && node.scrollIntoView) {
						node.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
				});
			}
		},
		isIrrelevantKey(k) {
			if (!k) return true;
			const key = String(k);
			// 过滤类似 ctrr_* / *rsrm* / 一些系统内部字段
			if (/^ctrr_/i.test(key)) return true;
			if (/rsrm/i.test(key)) return true;
			if (/^_id$/i.test(key)) return true;
			if (/^create_time$|^update_time$/i.test(key)) return true;
			return false;
		},
		showFaultTooltip(f, evt) {
			try {
				// 当鼠标在故障详情面板内部时，不弹出 tooltip（大屏与紧凑模式均适用）
				if (evt && evt.target && evt.target.closest && (evt.target.closest('.fault-detail') || evt.target.closest('.compact-fault-overlay'))) {
					return;
				}
			} catch (e) { /* noop */ }
			this.faultTooltip = { show: true, fault: f, left: 0, top: 0 };
			this.$nextTick(() => {
				const el = this.$refs.faultTooltip;
				if (el && el.getBoundingClientRect) {
					const rect = el.getBoundingClientRect();
					if (rect && rect.width) this.faultTooltipWidth = rect.width;
				}
				this.positionFaultTooltip(evt);
			});
		},
		moveFaultTooltip(evt) {
			try {
				if (evt && evt.target && evt.target.closest && (evt.target.closest('.fault-detail') || evt.target.closest('.compact-fault-overlay'))) {
					// 悬停在详情面板内时，确保不显示 tooltip
					this.faultTooltip.show = false;
					return;
				}
			} catch (e) { /* noop */ }
			if (!this.faultTooltip.show) return;
			this.positionFaultTooltip(evt);
		},
		hideFaultTooltip(evt) {
			try {
				const tip = this.$refs.faultTooltip;
				if (evt && tip && tip.contains && tip.contains(evt.relatedTarget)) return;
			} catch (e) { /* noop */ }
			this.faultTooltip.show = false;
		},
		expandFaultOverlay() {
			if (!this.selectedFault) return;
			this.faultOverlayMode = true;
		},
		closeFaultOverlay() {
			this.faultOverlayMode = false;
		},
		positionFaultTooltip(evt) {
			const offset = 12;
			const margin = 12;
			const width = this.faultTooltipWidth || 360;
			const viewport = window.innerWidth || document.documentElement.clientWidth || 1200;
			let left = evt.clientX + offset;
			if (left + width + margin > viewport) {
				left = evt.clientX - width - offset;
			}
			if (left < margin) left = margin;
			const top = evt.clientY + offset;
			this.faultTooltip.left = left;
			this.faultTooltip.top = top;
		},
		faultTooltipCables(f) {
			if (!f) return [];
			const pick = (idx) => {
				const cable = f[`involvedCable${idx}`];
				if (!cable) return null;
				return {
					cable,
					landing: f[`involvedLanding${idx}`] || '',
					distance: f[`distance${idx}`] || ''
				};
			};
			return [1, 2, 3].map(pick).filter(Boolean);
		},
		faultTooltipGridStyle(f) {
			const list = this.faultTooltipCables(f);
			const cols = Math.max(1, Math.min(3, list.length || 1));
			return { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(180px, 1fr))`, gap: '10px 12px' };
		},
		faultEntries(f) {
			try {
				const getter = (key) => {
					if (!f) return '';
					switch (key) {
						case '登记人': return f.registrar || (f.raw && f.raw['登记人']);
						case '涉及海缆名称': return f.cableName || f.name || (f.raw && f.raw['涉及海缆名称']);
						case '同路由海缆段': return f.sameRoute || (f.raw && f.raw['同路由海缆段']);
						case '故障描述': return f.desc || (f.raw && f.raw['故障描述']);
						case '工单号': return f.workOrder || (f.raw && f.raw['工单号']);
						case '开始时间': return f.start || (f.raw && f.raw['开始时间']);
						case '结束时间': return f.end || (f.raw && f.raw['结束时间']);
						case '故障原因': return f.cause || (f.raw && f.raw['故障原因']);
						case '处理进展': return f.progress || (f.raw && f.raw['处理进展']);
						case '业务影响情况': return f.impact || (f.raw && f.raw['业务影响情况']);
						case '备注': return f.remark || (f.raw && f.raw['备注']);
						case '是否重大': return f.isMajor || (f.raw && f.raw['是否重大']);
						default: return '';
					}
				};
				const order = ['登记人', '涉及海缆名称', '同路由海缆段', '故障描述', '工单号', '开始时间', '结束时间', '故障原因', '处理进展', '业务影响情况', '备注', '是否重大'];
				return order.map(k => ({ key: k, val: getter(k) }));
			} catch (e) { return []; }
		},
		displayLandingName(lp) {
			if (!lp) return '';
			const id = lp.id || '';
			const lang = this.getItemLang('landing', id);
			const raw = lp.name || '登陆站';
			if (lang === 'zh') return this.translateNameToZh(raw);
			return this.normalizeText(raw);
		},
		displayCableName(line) {
			if (!line) return '';
			const id = line.id || '';
			const lang = this.getItemLang('cable', id);
			const raw = line.name || '海缆';
			if (lang === 'zh') return this.translateNameToZh(raw);
			return this.normalizeText(raw);
		},
		translateContent(val, lang = 'zh') {
			if (val == null) return '';
			let s = String(val).trim();
			// Taiwan normalization first
			s = this.normalizeText(s);
			const zhMap = {
				'APAC': '亚太',
				'EMEA': '欧洲中东非',
				'AMER': '美洲',
				'Yes': '是',
				'No': '否',
				'Planned': '规划中',
				'TBD': '待定',
				'Unknown': '未知',
				'Unlabeled': '未标注'
			};
			const enMap = {
				'亚太': 'APAC',
				'欧洲中东非': 'EMEA',
				'美洲': 'AMER',
				'是': 'Yes',
				'否': 'No',
				'规划中': 'Planned',
				'待定': 'TBD',
				'未知': 'Unknown',
				'未标注': 'Unlabeled'
			};
			const map = lang === 'en' ? enMap : zhMap;
			return map[s] || s;
		},
		toggleCable(line) {
			if (!line) return;
			if (this.focusMode === 'cable' && this.focusedCableId === line.id) {
				this.clearFocus();
				this.toggleCableDetail(line); // keep detail toggle behavior
				return;
			}
			this.toggleCableDetail(line);
			this.focusCable(line);
		},
		toggleLanding(lp) {
			if (!lp) return;
			if (this.focusMode === 'landing' && this.focusedLanding && this.focusedLanding.id === lp.id) {
				this.clearFocus();
				this.toggleLandingDetail(lp);
				return;
			}
			this.toggleLandingDetail(lp);
			this.focusLanding(lp);
		},
		// 列表项点击（海缆）：再次点击同一项则退出聚焦
		onCableItemClick(line) {
			if (!line) return;
			if (this.focusMode === 'cable' && this.focusedCableId === line.id) {
				this.clearFocus();
				return;
			}
			this.focusCable(line);
		},
		// 列表项点击（登陆站）：再次点击同一项则退出聚焦
		onLandingItemClick(lp) {
			if (!lp) return;
			if (this.focusMode === 'landing' && this.focusedLanding && this.focusedLanding.id === lp.id) {
				this.clearFocus();
				return;
			}
			this.focusLanding(lp);
		},
		getItemLang(type, id) {
			const pref = this.langPref && this.langPref[type];
			const key = String(id || '').trim();
			return (pref && pref[key]) || 'zh';
		},
		toggleItemLang(type, id) {
			const key = String(id || '').trim();
			if (!key) return;
			if (!this.langPref[type]) this.$set(this.langPref, type, {});
			const cur = this.langPref[type][key] || 'zh';
			this.$set(this.langPref[type], key, cur === 'zh' ? 'en' : 'zh');
		},
		tLabel(key, type, id) {
			const lang = this.getItemLang(type, id);
			const zh = {
				branch: '支路海缆', name: '名称', id: '编号', feature_id: 'feature_id', ownership: '权益类型', rfs_year: '商用年', is_planned: '是否规划', length: '长度', owners: '运营商', suppliers: '供应商', landings: '登陆点', coords: '经纬度', is_tbd: '是否待定', country: '国家', cables: '关联海缆', website: '网址'
			};
			const en = {
				branch: 'Branch Cables', name: 'Name', id: 'ID', feature_id: 'feature_id', ownership: 'Ownership', rfs_year: 'RFS Year', is_planned: 'Planned', length: 'Length', owners: 'Owners', suppliers: 'Suppliers', landings: 'Landing Points', coords: 'Coordinates', is_tbd: 'TBD', country: 'Country', cables: 'Cables', website: 'Website'
			};
			const dict = (lang === 'en') ? en : zh;
			return dict[key] || key;
		},
		getCableUrl(line) {
			const id = line?.id;
			const d = this.cableDetails[id] || this.cableDetail.detail || {};
			return d.url || d.URL || d.website || d.Website || d.link || d.Link || '';
		},
		normalizeText(val) {
			if (val == null) return '';
			let s = String(val);
			// 中文替换：所有“台湾”替换为“中国台湾省”
			s = s.replace(/台湾/g, '中国台湾省');
			// 英文短语规范：包含 taiwan 或与 china/chian 组合时，统一翻译为“中国台湾省”
			s = s.replace(/\b(taiwan\s*(china|chian)?|china\s*taiwan)\b/gi, '中国台湾省');
			// 独立的 taiwan 也翻译为“中国台湾省”
			s = s.replace(/\btaiwan\b/gi, '中国台湾省');
			return s;
		},
		selectOnlyOwnership(val) {
			if (!val) return;
			this.selectedOwnerships = [val];
			this.ownershipOnly = true;
		},
		selectOnlyType(val) {
			if (!val) return;
			this.selectedTypes = [val];
			this.updateChart();
			this.landingPage = 1;
		},
		selectAllOwnerships() {
			// 全选仅包含权益类型，不勾选非权益
			this.selectedOwnerships = ['自建', '合建', '租用'];
			this.ownershipOnly = true;
			this.updateChart();
		},
		selectAllTypes() {
			this.selectedTypes = ['跨太平洋', '亚欧互联', '区域互联', '其他'];
			this.updateChart();
			this.landingPage = 1;
		},
		selectAllRanges() {
			this.scopeContinent = 'all';
			this.scopeDistance = 'all';
			this.updateChart();
			this.landingPage = 1;
		},
		resetAllFilters() {
			// 恢复到首次加载的全局默认态
			this._suppressUpdate = true;
			const wasGlobe = this.isGlobe;
			this.isGlobe = false;
			this.mapVersion = 'ap-zh';
			this.mapVersionPrev = 'ap-zh';
			this.twoDRebuildMode = 'saved';
			this.threeDRebuildMode = 'saved';
			this.threeDArcStepKm = 150;
			this._globeRebuildCache = {};
			this.autoRotate = false;
			this.autoRotateSpeed = 0.9;
			this.currentGlobeTextureKey = 'topo';
			// 移除旧的 2D 背景纹理选择，统一使用底色风格
			this.currentTitleBgKey = 'banner-default';
			this.geoZoom = 1.8;
			this.globeDistance = 130;
			this.globeMaxDistance = 320;
			this.zoomSlider = 50;
			this.showCables = true;
			this.showLandings = true;
			this.showFaultCablesOnMap = true;
			this.showLandingLabels = false;
			this.landingOwnershipOnly = true;
			this.ownershipOnly = true;
			this.selectedOwnerships = ['自建', '合建', '租用'];
			this.selectedTypes = ['跨太平洋', '亚欧互联', '区域互联', '其他'];
			this.scopeContinent = 'all';
			this.scopeDistance = 'all';
			this.searchCable = '';
			this.searchLanding = '';
			this.searchFault = '';
			this.cablePage = 1;
			this.landingPage = 1;
			this.overviewRegion = '默认';
			this.mapDialOpen = false;
			this.clearFocus();
			this.statesToSlider();
			// 若当前已有图表实例，切换维度前先销毁，避免 ECharts geo regions 报错
			try { if (this.myChart) { this.myChart.dispose(); this.myChart = null; this.chartEventTarget = null; } } catch (e) { }
			const refresh = async () => {
				try {
					await this.ensureBaseMapForMode();
					await this.loadCableData();
					this._suppressUpdate = false;
					this.updateChart();
					if (wasGlobe) this.$nextTick(() => this.onResize());
				} catch (e) {
					this._suppressUpdate = false;
					this.updateChart();
				}
			};
			refresh();
		},
		restartApp() {
			// 直接整页刷新，确保状态与缓存数据重新加载
			window.location.reload();
		},
		openCableModal(line) {
			if (!line) return;
			this.cableDetail.id = line.id;
			this.cableDetail.line = line;
			if (!this.cableDetails[line.id]) this.fetchCableDetail(line);
			this.modal = { show: true, type: 'cable', line, lp: null, detail: this.cableDetails[line.id] || this.cableDetail.detail || null };
		},
		openLandingModal(lp) {
			if (!lp) return;
			this.landingDetail.id = lp.id;
			this.landingDetail.lp = lp;
			if (!this.stationDetails[lp.id]) this.fetchStationDetail(lp);
			this.modal = { show: true, type: 'landing', line: null, lp, detail: this.stationDetails[lp.id] || this.landingDetail.detail || null };
		},
		closeModal() {
			this.modal.show = false;
		},
		buildOwnershipMap() {
			const map = new Map();
			const globalList = (typeof cableData !== 'undefined' && Array.isArray(cableData))
				? cableData
				: Array.isArray(window.cableData)
					? window.cableData
					: Array.isArray(globalThis.cableData)
						? globalThis.cableData
						: [];
			const list = Array.isArray(globalList) ? globalList : [];
			list.forEach(item => {
				const id = item?.id;
				const holder = Number(item?.detail?.is_holder) || 0;
				if (!id || !holder) return;
				const prev = map.get(id) || 0;
				if (holder > prev) map.set(id, holder);
			});
			return map;
		},
		buildLandingOwnershipFromQuanyi() {
			const map = new Map();
			const globalList = (typeof cableData !== 'undefined' && Array.isArray(cableData))
				? cableData
				: Array.isArray(window.cableData)
					? window.cableData
					: Array.isArray(globalThis.cableData)
						? globalThis.cableData
						: [];
			const list = Array.isArray(globalList) ? globalList : [];
			list.forEach(item => {
				const holder = Number(item?.detail?.is_holder) || 0;
				if (!holder) return;
				const raw = item?.detail?.landing_points;
				const entries = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\s*,\s*/) : [];
				entries.forEach(name => {
					const key = String(name || '').trim();
					if (!key) return;
					const normalized = this.formatLandingName(key).toLowerCase();
					const prev = map.get(key) || 0;
					const prevNorm = map.get(normalized) || 0;
					if (holder > prev) map.set(key, holder);
					if (holder > prevNorm) map.set(normalized, holder);
				});
			});
			return map;
		},
		mapOwnershipLabel(holder) {
			if (holder === 3) return '自建';
			if (holder === 2) return '合建';
			if (holder === 1) return '租用';
			return '';
		},
		ownershipWeight(label) {
			if (label === '自建') return 3;
			if (label === '合建') return 2;
			if (label === '租用') return 1;
			if (label === '非权益') return 0;
			return 0;
		},
		ownershipColor(label) {
			if (label === '自建') return '#00c778';
			if (label === '合建') return '#ffc107';
			if (label === '租用') return '#4890ff';
			if (label === '非权益') return '#8aa4c4';
			return '#8aa4c4';
		},
		ownershipClass(label) {
			if (label === '自建') return 'ownership-tag self';
			if (label === '合建') return 'ownership-tag co';
			if (label === '租用') return 'ownership-tag rent';
			if (label === '非权益') return 'ownership-tag none';
			return 'ownership-tag none';
		},
		// 登陆站点基础尺寸（按权益）
		ownershipLandingSize(label) {
			if (label === '自建') return 18;
			if (label === '合建') return 14;
			if (label === '租用') return 12;
			if (label === '非权益') return 8;
			return 12;
		},
		hexToRgba(hex, alpha = 1) {
			if (!hex) return `rgba(138,164,196,${alpha})`;
			let h = hex.replace('#', '');
			if (h.length === 3) h = h.split('').map(c => c + c).join('');
			const r = parseInt(h.slice(0, 2), 16);
			const g = parseInt(h.slice(2, 4), 16);
			const b = parseInt(h.slice(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		},
		tooltipThemeStyle(kind, entity) {
			const label = (entity && entity.ownership) ? entity.ownership : '非权益';
			const color = this.ownershipColor(label);
			const glow = this.hexToRgba(color, 0.28);
			return {
				borderColor: color,
				boxShadow: `0 10px 28px rgba(0,0,0,0.38), 0 0 14px ${glow}`
			};
		},
		pillThemeStyle(kind, entity) {
			const label = (entity && entity.ownership) ? entity.ownership : '非权益';
			const color = this.ownershipColor(label);
			return {
				borderColor: this.hexToRgba(color, 0.35),
				background: this.hexToRgba(color, 0.12),
				color
			};
		},
		// 类型标识（海缆/登陆站）固定配色，不随权益变化
		typeThemeStyle(kind) {
			if (kind === 'cable') {
				return { borderColor: '#48dbfb', background: 'rgba(72,219,251,0.18)', color: '#d8f5ff' };
			}
			if (kind === 'landing') {
				return { borderColor: '#7c8cff', background: 'rgba(124,140,255,0.18)', color: '#e4e7ff' };
			}
			return { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#e8f7ff' };
		},
		displayMacroRegion(code) {
			const map = { APAC: '亚太', EMEA: '欧洲中东非', AMER: '美洲', OTHER: '其他', all: '全部' };
			if (!code) return '';
			const key = String(code).toUpperCase();
			return map[key] || code;
		},
		displayContinents(val) {
			if (!val) return '';
			if (Array.isArray(val)) {
				const uniq = [...new Set(val.filter(Boolean))];
				return uniq.length ? uniq.join('、') : '';
			}
			return String(val);
		},
		displayDirection(val) {
			if (!val) return '-';
			return val;
		},
		// 将样式对象序列化为 inline-style 字符串
		styleStr(obj) {
			try {
				if (!obj || typeof obj !== 'object') return '';
				const toKebab = s => String(s).replace(/[A-Z]/g, m => '-' + m.toLowerCase());
				return Object.keys(obj).map(k => `${toKebab(k)}:${obj[k]}`).join(';');
			} catch (e) { return ''; }
		},
		// 从 ECharts tooltip 参数中解析所属权益类型
		getTooltipOwnership(p) {
			try {
				if (!p) return '非权益';
				if (p.seriesType === 'lines' || p.seriesType === 'lines3D') {
					return (p.data && p.data.lineData && (p.data.lineData.ownership || '非权益')) || '非权益';
				}
				if (p.seriesType === 'scatter' || p.seriesType === 'effectScatter' || p.seriesType === 'scatter3D') {
					const lpOwn = p.data && p.data.lpData && p.data.lpData.ownership;
					if (lpOwn) return lpOwn;
					const lnOwn = p.data && p.data.lineData && p.data.lineData.ownership;
					if (lnOwn) return lnOwn;
					return '非权益';
				}
				return '非权益';
			} catch (e) { return '非权益'; }
		},
		// 将主题配色应用到 ECharts 外层 tooltip 容器（而非内部的 .map-tip）
		applyMapTooltipTheme(color) {
			const glow = this.hexToRgba(color, 0.28);
			const apply = () => {
				try {
					const root = (this.myChart && this.myChart.getDom) ? this.myChart.getDom() : null;
					const tip = root ? root.querySelector('.echarts-tooltip') : document.querySelector('.echarts-tooltip');
					if (!tip) return;
					tip.style.border = `1px solid ${color}`;
					tip.style.boxShadow = `0 10px 28px rgba(0,0,0,0.38), 0 0 14px ${glow}`;
					tip.style.borderRadius = '10px';
					// 保持与全局 tooltip 设置一致的深色背景
					tip.style.backgroundColor = 'rgba(8,15,30,0.92)';
				} catch (e) { /* noop */ }
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply); else setTimeout(apply, 0);
		},
		translationLng(pair) {
			let [lng, lat] = pair || [];
			if (lng < -35) lng = lng + 360;
			return [lng, lat];
		},
		revertTranslationLng(pair) {
			let [lng, lat] = pair || [];
			if (lng > 180) lng = lng - 360;
			return [lng, lat];
		},
		// 归一化经度到 [-180,180]
		normalizeLon(lon) {
			let x = Number(lon);
			if (!isFinite(x)) return 0;
			while (x > 180) x -= 360;
			while (x < -180) x += 360;
			return x;
		},
		// lon/lat(度) -> 单位球向量
		lonLatToVec3(lonLat) {
			const [lon, lat] = lonLat;
			const lr = (Number(lat) || 0) * Math.PI / 180;
			const rr = (Number(lon) || 0) * Math.PI / 180;
			const x = Math.cos(lr) * Math.cos(rr);
			const y = Math.cos(lr) * Math.sin(rr);
			const z = Math.sin(lr);
			return [x, y, z];
		},
		// 单位球向量 -> lon/lat(度)
		vec3ToLonLat(v) {
			const [x, y, z] = v;
			const lat = Math.asin(Math.max(-1, Math.min(1, z))) * 180 / Math.PI;
			const lon = Math.atan2(y, x) * 180 / Math.PI;
			return [this.normalizeLon(lon), lat];
		},
		// 球面线性插值（slerp）
		slerp(a, b, t) {
			const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
			const omega = Math.acos(dot);
			if (omega < 1e-6) {
				// 几乎重合，退化为线性
				return [
					a[0] + (b[0] - a[0]) * t,
					a[1] + (b[1] - a[1]) * t,
					a[2] + (b[2] - a[2]) * t
				];
			}
			const sinO = Math.sin(omega);
			const c1 = Math.sin((1 - t) * omega) / sinO;
			const c2 = Math.sin(t * omega) / sinO;
			return [
				c1 * a[0] + c2 * b[0],
				c1 * a[1] + c2 * b[1],
				c1 * a[2] + c2 * b[2]
			];
		},
		// 在两点间按步距（km）密化球面路径
		densifyArc(aLonLat, bLonLat, stepKm = 150) {
			const A = Array.isArray(aLonLat) ? aLonLat : null;
			const B = Array.isArray(bLonLat) ? bLonLat : null;
			if (!A || !B) return [];
			const dist = this.distanceKm(A, B);
			const steps = Math.max(1, Math.ceil(dist / stepKm));
			const va = this.lonLatToVec3(A);
			const vb = this.lonLatToVec3(B);
			const out = [];
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const v = this.slerp(va, vb, t);
				out.push(this.vec3ToLonLat(v));
			}
			return out;
		},
		// 3D 海缆重算：恢复跨太平洋串联，必要时跨日界线展平并密化
		recomputeGlobeSegments(line) {
			if (!line) return [];
			const id = String(line.feature_id || line.id || line.name || '').trim();
			const step = Number(this.threeDArcStepKm) || 150;
			if (!this._globeRebuildCache) this._globeRebuildCache = {};
			const cacheKey = id ? `${id}__step${step}` : `raw_${Math.random()}`;
			if (this._globeRebuildCache[cacheKey]) return this._globeRebuildCache[cacheKey];
			const base = (Array.isArray(line.segments_globe) && line.segments_globe.length)
				? line.segments_globe
				: (Array.isArray(line.coords_globe) && line.coords_globe.length ? [line.coords_globe] : (Array.isArray(line.coords) ? [line.coords] : []));
			const unwrapChain = this.unwrapSegmentsChain(base).filter(s => Array.isArray(s) && s.length >= 2);
			const span = (() => {
				const flat = unwrapChain.flat();
				const lons = flat.map(p => Number(p[0])).filter(isFinite);
				if (!lons.length) return 0;
				return Math.max(...lons) - Math.min(...lons);
			})();
			let segs = unwrapChain.length ? unwrapChain : base;
			const needMergePacific = (line.type === '跨太平洋') || span > 260;
			if (needMergePacific) {
				const merged = this.mergeSegmentsAcrossPacific(base);
				if (merged && merged.length) {
					segs = merged.map(seg => this.unwrapSegment(seg));
				}
			}
			const wrapLon = (lon) => {
				let v = Number(lon);
				if (!isFinite(v)) return lon;
				while (v > 180) v -= 360;
				while (v < -180) v += 360;
				return v;
			};
			const densifySeg = (seg) => {
				if (!Array.isArray(seg) || seg.length < 2) return [];
				const out = [];
				for (let i = 0; i < seg.length - 1; i++) {
					const a = seg[i];
					const b = seg[i + 1];
					const arc = this.densifyArc(a, b, step);
					arc.forEach((pt, idx) => {
						if (!Array.isArray(pt) || pt.length < 2) return;
						const lon = wrapLon(pt[0]);
						const lat = Number(pt[1]);
						if (!isFinite(lon) || !isFinite(lat)) return;
						if (out.length && idx === 0) return; // 避免重复首点
						out.push([lon, lat]);
					});
				}
				if (!out.length) return seg.map(pt => [wrapLon(pt[0]), pt[1]]);
				return out;
			};
			const densified = (Array.isArray(segs) ? segs : []).map(densifySeg).filter(s => s.length >= 2);
			this._globeRebuildCache[cacheKey] = densified.length ? densified : (Array.isArray(segs) ? segs : []);
			return this._globeRebuildCache[cacheKey];
		},
		// 生成 3D 重算结果：仅对跨太平洋线路进行球面连通并返回最小化结构
		async compute3DRebuiltFromRaw() {
			const res = await fetch(encodeURI('海缆数据/cable-geo_v3.json'));
			if (!res.ok) throw new Error(`加载海缆总表失败: HTTP ${res.status}`);
			const json = await res.json();
			const features = Array.isArray(json?.features) ? json.features : [];
			const ownershipMap = this.buildOwnershipMap();
			const mapped = features
				.map(f => this.transformFeature(f, ownershipMap))
				.filter(Boolean)
				.sort((a, b) => (b.is_holder || 0) - (a.is_holder || 0));
			const minimize = (l) => ({
				id: l.id,
				feature_id: l.feature_id,
				name: l.name,
				status: l.status || 'ok',
				ownership: l.ownership,
				ownershipClass: l.ownershipClass,
				color: l.color,
				continent: l.continent,
				continents: l.continents,
				direction: l.direction,
				type: l.type,
				coords_globe: l.coords_globe || l.coords,
				segments_globe: this.recomputeGlobeSegments(l),
				arcStepKm: Number(this.threeDArcStepKm) || 150
			});
			return mapped.map(minimize);
		},
		// 加载已保存的 3D 重算结果（默认加载）
		async loadSaved3DGlobe() {
			try {
				// 与后端保存一致，使用无空格文件名以避免 404
				const url = encodeURI('海缆数据/重构的数据/3d海缆数据.json');
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) return [];
				const json = await res.json();
				const arr = Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
				return arr.map(l => ({
					...l,
					status: l.status || 'ok',
					ownershipClass: l.ownershipClass || this.ownershipClass(l.ownership || '非权益'),
					color: l.color || this.ownershipColor(l.ownership || '非权益'
					)
				}));
			} catch (e) { return []; }
		},
		// 持久化 3D 重算结果到服务器文件
		async persist3DRebuilt(items) {
			const preferred = this.enginePreferenceFromMode(this.threeDRebuildMode);
			const engine = await this.resolveEngine(preferred);
			const file = (engine === 'py3')
				? 'save_rebuilt_3d_py3.php'
				: (engine === 'py2')
					? 'save_rebuilt_3d_py2.php'
					: 'save_rebuilt_3d.php';
			const payload = { version: 1, savedAt: Date.now(), items };
			const ret = await this.postJsonWithFallback(this.buildSaveUrlCandidates(file), payload);
			if (!ret || ret.ok !== true) throw new Error(ret && ret.error || '保存失败');
			return { ...ret, engine };
		},
		convertCoordForMapVersion(coord, fromVersion, toVersion) {
			if (!Array.isArray(coord) || coord.length < 2) return null;
			if (fromVersion === toVersion) return coord;
			const fromAp = fromVersion === 'ap-zh';
			const toAp = toVersion === 'ap-zh';
			if (fromAp && !toAp) return this.revertTranslationLng(coord);
			if (!fromAp && toAp) return this.translationLng(coord);
			return coord;
		},
		// 构造保存/探针的候选 URL（兼容 ASCII 与中文目录、相对与绝对路径）
		// 说明：
		// - 优先使用 backend/save 路径，已移除旧目录“重算并保存功能”的回退
		// - 同时提供相对路径与绝对路径候选，确保在不同部署根路径均可访问
		// - 使用 URL 规范化以处理中文目录名与多余斜杠，避免重复与非法 URL
		buildSaveUrlCandidates(file) {
			// 仅返回单一相对路径，避免多端口/多根路径探测造成大量 404 噪音
			return [`backend/save/${file}`];
		},
		async postJsonWithFallback(urls, payload) {
			let lastErr = null;
			const errors = [];
			for (const url of urls) {
				try {
					const res = await fetch(url, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload),
						credentials: 'same-origin'
					});
					if (!res.ok) {
						lastErr = new Error(`HTTP ${res.status}`);
						errors.push(`${url}: HTTP ${res.status}`);
						continue;
					}
					return await res.json();
				} catch (e) {
					lastErr = e;
					errors.push(`${url}: ${e && e.message ? e.message : e}`);
				}
			}
			const msg = errors.length ? errors.join('; ') : null;
			throw lastErr || new Error(msg || '保存请求失败');
		},
		async detectSaveEngine() {
			const probeFiles = ['engine_probe_py3.php', 'engine_probe_py2.php'];
			for (const file of probeFiles) {
				const engine = file.includes('py3') ? 'py3' : 'py2';
				for (const url of this.buildSaveUrlCandidates(file)) {
					try {
						const r = await fetch(url, { cache: 'no-store' });
						if (r && r.ok) return engine;
					} catch (e) {}
				}
			}
			return 'php';
		},
		// 根据重算模式确定首选引擎
		enginePreferenceFromMode(mode) {
			if (!mode) return null;
			if (mode === 'recompute-py3') return 'py3';
			if (mode === 'recompute-py2') return 'py2';
			if (mode === 'recompute-php') return 'php';
			return null; // saved / recompute-auto 走自动探针
		},
		engineLabelFromMode(mode) {
			const pref = this.enginePreferenceFromMode(mode);
			return pref || '自动';
		},
		async resolveEngine(preferred) {
			if (preferred === 'py3' || preferred === 'py2' || preferred === 'php') return preferred;
			return this.detectSaveEngine();
		},
		mapCoordForDisplay(coord) {
			if (!Array.isArray(coord) || coord.length < 2) return null;
			return (this.mapVersion === 'ap-zh') ? this.translationLng(coord) : this.revertTranslationLng(coord);
		},
		displayCoordFromStr(raw) {
			const coord = this.parseCoordStr(raw);
			if (!coord) return null;
			// 3D 模式下使用标准经纬度（不做亚太中心平移），避免坐标超出 [-180,180] 导致不显示
			if (this.isGlobe) {
				const lon = this.normalizeLon(coord[0]);
				const lat = Number(coord[1]);
				if (!isFinite(lon) || !isFinite(lat)) return null;
				return [lon, lat];
			}
			return this.mapCoordForDisplay(coord);
		},
		// 数字格式化（概览面板）
		formatInt(val) {
			const n = Math.round(Number(val || 0));
			return n.toLocaleString('zh-CN');
		},
		formatG(val) {
			const n = Number(val || 0);
			const text = Math.round(n).toLocaleString('zh-CN');
			return text + ' G';
		},
		formatKm(val) {
			const n = Number(val || 0);
			const text = Math.round(n).toLocaleString('zh-CN');
			return text + ' km';
		},
		formatPercent(val) {
			const n = Number(val || 0);
			return Math.round(n) + ' %';
		},
		formatLandingName(raw) {
			if (!raw) return '';
			return String(raw).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
		},
		normalizeLandingPoints(detail) {
			if (!detail || !detail.landing_points) return [];
			const raw = detail.landing_points;
			const list = [];
			const toItem = (entry) => {
				if (!entry) return null;
				if (typeof entry === 'string') {
					const id = entry.trim();
					if (!id) return null;
					const name = this.formatLandingName(id) || id;
					return { id, name };
				}
				if (typeof entry === 'object') {
					const id = entry.id || entry.landing_point_id || entry.landing_point || entry.name;
					const name = entry.name || entry.landing_point || this.formatLandingName(id);
					return { ...entry, id, name };
				}
				return null;
			};
			if (Array.isArray(raw)) {
				raw.forEach(item => {
					const obj = toItem(item);
					if (obj) list.push(obj);
				});
			} else if (typeof raw === 'string') {
				raw.split(/\s*,\s*/).forEach(str => {
					const obj = toItem(str);
					if (obj) list.push(obj);
				});
			}
			return list;
		},
		// Haversine distance (km) between two lon/lat pairs
		distanceKm(a, b) {
			if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return Infinity;
			const toRad = d => d * Math.PI / 180;
			const R = 6371;
			const dLat = toRad(b[1] - a[1]);
			const dLon = toRad(b[0] - a[0]);
			const lat1 = toRad(a[1]);
			const lat2 = toRad(b[1]);
			const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
			return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
		},
		parseCoordStr(raw) {
			if (!raw) return null;
			const parts = String(raw).split(/[，,\s]+/).map(v => Number(v));
			if (parts.length < 2) return null;
			const [lon, lat] = parts;
			if (!isFinite(lon) || !isFinite(lat)) return null;
			return [lon, lat];
		},
		formatCoordStr(coord, digits = 6) {
			if (!Array.isArray(coord) || coord.length < 2) return '';
			const [lon, lat] = coord;
			if (!isFinite(lon) || !isFinite(lat)) return '';
			return `${Number(lon).toFixed(digits)},${Number(lat).toFixed(digits)}`;
		},
		findCableByEditName(name) {
			const cableRaw = this.normalizeText(name || '').toLowerCase();
			if (!cableRaw) return null;
			// 2Africa 特殊处理：该海缆在数据中拆分为多段，需在打点时合并为一条虚拟线路用于测距
			if (cableRaw.includes('2africa')) {
				const source = (Array.isArray(this.filteredCablesMap) && this.filteredCablesMap.length)
					? this.filteredCablesMap
					: (Array.isArray(this.cableLines) ? this.cableLines : []);
				const parts = source.filter(l => this.normalizeText(l.name || '').toLowerCase().includes('2africa'));
				if (parts.length) {
					const merged = { ...parts[0] };
					const allCoords = [];
					const allSegs = [];
					parts.forEach(l => {
						if (Array.isArray(l.coords)) allCoords.push(...l.coords);
						const segs = (Array.isArray(l.segments) && l.segments.length) ? l.segments : this.splitLineSegments(l.coords || []);
						if (Array.isArray(segs) && segs.length) allSegs.push(...segs);
					});
					merged.coords = allCoords;
					merged.segments = allSegs;
					return merged;
				}
			}
			return (this.cableLines || []).find(l => {
				const cands = [l.feature_id, l.id, l.name].map(v => this.normalizeText(v || '').toLowerCase());
				return cands.includes(cableRaw);
			}) || null;
		},
		visibleCableIdSet() {
			const src = (Array.isArray(this.filteredCablesMap) && this.filteredCablesMap.length)
				? this.filteredCablesMap
				: (Array.isArray(this.cableLines) ? this.cableLines : []);
			const norm = v => String(v || '').trim().toLowerCase();
			return new Set(src.flatMap(l => [norm(l.id), norm(l.name), norm(l.feature_id)]).filter(Boolean));
		},
		computeLandingDefaultSelected(detail, lp = null) {
			const visible = this.visibleCableIdSet();
			if (!visible.size) return [];
			const cables = Array.isArray(detail?.cables) ? detail.cables : (Array.isArray(lp?.cables) ? lp.cables : []);
			return cables
				.map(cb => cb.id || cb.feature_id || cb.name)
				.filter(id => {
					const key = String(id || '').trim().toLowerCase();
					return key && visible.has(key);
				});
		},
		findLandingCoordByName(name) {
			const norm = v => this.normalizeText(v || '').toLowerCase();
			const target = norm(name);
			if (!target) return null;
			const lp = (this.landingPoints || []).find(p => {
				const names = [p.name, this.formatLandingName(p.name), p.id].map(x => norm(x));
				return names.includes(target);
			});
			return (lp && Array.isArray(lp.coords)) ? lp.coords : null;
		},
		// 基于线路节点图的路径测距：将海缆分段拆为图节点，投影鼠标/起点到最近段，随后跑 Dijkstra，限制最大离线偏移
		computeDistanceFromStart(line, startCoord, targetCoord, opts = {}) {
			const maxOffsetKm = opts.maxOffsetKm ?? 30;
			const connectKm = opts.connectKm ?? 15; // 连接断裂分段的端点距离阈值
			if (!line || !Array.isArray(startCoord) || !Array.isArray(targetCoord)) return null;
			const rawSegments = (Array.isArray(line.segments) && line.segments.length)
				? line.segments
				: this.splitLineSegments(line.coords || []);
			const segments = rawSegments
				.map(seg => (Array.isArray(seg) ? seg.filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) : []))
				.filter(seg => seg.length >= 2);
			if (!segments.length) return null;
			const keyOf = (p) => `${Number(p[0]).toFixed(6)},${Number(p[1]).toFixed(6)}`;
			const nodes = [];
			const keyToId = new Map();
			const adj = [];
			const addNode = (pt) => {
				const k = keyOf(pt);
				if (keyToId.has(k)) return keyToId.get(k);
				const id = nodes.length;
				nodes.push([Number(pt[0]), Number(pt[1])]);
				adj.push(new Map());
				keyToId.set(k, id);
				return id;
			};
			const addEdge = (a, b, w) => {
				if (a === b) return;
				const weight = isFinite(w) ? w : this.distanceKm(nodes[a], nodes[b]);
				const ma = adj[a];
				const mb = adj[b];
				if (!ma.has(b) || ma.get(b) > weight) ma.set(b, weight);
				if (!mb.has(a) || mb.get(a) > weight) mb.set(a, weight);
			};
			// 建图：分段内相邻点连边
			const segNodeIds = segments.map(seg => seg.map(addNode));
			segNodeIds.forEach((ids, idx) => {
				const seg = segments[idx];
				for (let i = 1; i < ids.length; i++) {
					addEdge(ids[i - 1], ids[i], this.distanceKm(seg[i - 1], seg[i]));
				}
			});
			// 连接分段端点：端点距离在 connectKm 内视为同一交汇点
			const endpoints = segNodeIds.flatMap(ids => (ids.length ? [ids[0], ids[ids.length - 1]] : []));
			for (let i = 0; i < endpoints.length; i++) {
				for (let j = i + 1; j < endpoints.length; j++) {
					const a = endpoints[i];
					const b = endpoints[j];
					const d = this.distanceKm(nodes[a], nodes[b]);
					if (d <= connectKm) addEdge(a, b, d);
				}
			}
			const project = (pt, a, b) => {
				const apx = pt[0] - a[0];
				const apy = pt[1] - a[1];
				const abx = b[0] - a[0];
				const aby = b[1] - a[1];
				const ab2 = abx * abx + aby * aby;
				const tRaw = ab2 ? (apx * abx + apy * aby) / ab2 : 0;
				const t = Math.max(0, Math.min(1, tRaw));
				return { t, point: [a[0] + abx * t, a[1] + aby * t] };
			};
			const findNearestProjection = (coord) => {
				let best = null;
				segments.forEach((seg, si) => {
					for (let i = 1; i < seg.length; i++) {
						const a = seg[i - 1];
						const b = seg[i];
						const proj = project(coord, a, b);
						const p = proj.point;
						const toLine = this.distanceKm(coord, p);
						if (!best || toLine < best.toLine) {
							best = {
								segIndex: si,
								a,
								b,
								aId: segNodeIds[si][i - 1],
								bId: segNodeIds[si][i],
								point: p,
								toLine,
								t: proj.t
							};
						}
					}
				});
				return best;
			};
			const attachProjection = (coord) => {
				const best = findNearestProjection(coord);
				if (!best || best.toLine > maxOffsetKm) return null;
				const distA = this.distanceKm(coord, best.a);
				const distB = this.distanceKm(coord, best.b);
				const nearEps = 0.01; // km
				if (distA < nearEps) return { nodeId: best.aId, point: nodes[best.aId], toLine: best.toLine };
				if (distB < nearEps) return { nodeId: best.bId, point: nodes[best.bId], toLine: best.toLine };
				const k = keyOf(best.point);
				let pid = keyToId.get(k);
				if (pid == null) pid = addNode(best.point);
				addEdge(pid, best.aId, this.distanceKm(best.point, best.a));
				addEdge(pid, best.bId, this.distanceKm(best.point, best.b));
				return { nodeId: pid, point: nodes[pid], toLine: best.toLine };
			};
			const startAttach = attachProjection(startCoord);
			const targetAttach = attachProjection(targetCoord);
			if (!startAttach || !targetAttach) return null;
			const n = nodes.length;
			const dist = new Array(n).fill(Infinity);
			const prev = new Array(n).fill(-1);
			const visited = new Array(n).fill(false);
			dist[startAttach.nodeId] = 0;
			for (let iter = 0; iter < n; iter++) {
				let u = -1;
				let best = Infinity;
				for (let i = 0; i < n; i++) {
					if (!visited[i] && dist[i] < best) {
						best = dist[i];
						u = i;
					}
				}
				if (u === -1 || u === targetAttach.nodeId) break;
				visited[u] = true;
				adj[u].forEach((w, v) => {
					if (visited[v]) return;
					const nd = dist[u] + w;
					if (nd < dist[v]) {
						dist[v] = nd;
						prev[v] = u;
					}
				});
			}
			if (!isFinite(dist[targetAttach.nodeId]) || dist[targetAttach.nodeId] === Infinity) return null;
			const pathIds = [];
			let cur = targetAttach.nodeId;
			while (cur !== -1) {
				pathIds.push(cur);
				cur = prev[cur];
				if (cur === startAttach.nodeId) {
					pathIds.push(cur);
					break;
				}
			}
			if (pathIds[pathIds.length - 1] !== startAttach.nodeId) {
				pathIds.push(startAttach.nodeId);
			}
			pathIds.reverse();
			const pathCoords = pathIds.map(id => nodes[id]);
			return {
				point: targetAttach.point,
				distanceKm: dist[targetAttach.nodeId],
				toLine: targetAttach.toLine,
				path: pathCoords
			};
		},
		// 包装测距：以登陆站为起点，严格限制离线偏移（30/80km），确保只在海缆走线上取点
		computeDistanceAlongLine(line, coord, landingName = null) {
			if (!line || !Array.isArray(coord) || coord.length < 2) return null;
			const startName = landingName || this.faultEditState.landing || this.faultEditState.landingAlt || '';
			const startCoord = this.findLandingCoordByName(startName);
			if (!startCoord) return null;
			const primary = this.computeDistanceFromStart(line, startCoord, coord, { maxOffsetKm: 30 });
			if (primary && isFinite(primary.toLine)) return primary;
			const loose = this.computeDistanceFromStart(line, startCoord, coord, { maxOffsetKm: 80 });
			if (loose && isFinite(loose.toLine)) return loose;
			return null; // 仅允许在线上打点
		},
		setFaultPointMarkerFromCoord(coord) {
			if (Array.isArray(coord) && coord.length >= 2 && isFinite(coord[0]) && isFinite(coord[1])) {
				this.faultPointMarker = { coord: [Number(coord[0]), Number(coord[1])] };
			} else {
				this.faultPointMarker = null;
			}
		},
		clearFaultPointMarker() {
			this.faultPointMarker = null;
		},
		// 进入打点模式：预加载必需数据，关闭干扰层，确保紧凑/大屏一致
		async startFaultPointPick() {
			if (!this.faultEditState.active) {
				this.faultEditState.error = '请先点击编辑';
				return;
			}
			if (!this.faultEditState.cable) {
				this.faultEditState.error = '请先选择涉及海缆';
				return;
			}
			if (!this.faultEditState.landing) {
				this.faultEditState.error = '请先选择登陆站';
				return;
			}
			this.faultEditState.error = '';
			// 打点会话开始时默认收起地图工具入口
			this.mapDialOpen = false;
			try { await this.ensureLandingPointsLoaded(); } catch (e) { /* noop */ }
			try {
				const editLine = this.findCableByEditName(this.faultEditState.cable || '');
				if (editLine?.id) { await this.ensureCableDetail(editLine.id); }
			} catch (e) { /* noop */ }
			this.faultPickHover = null;
			this.faultPickLast = null;
			this.faultPickConfirmVisible = false;
			this.faultPickConfirmInfo = null;
			this.faultPickPath = null;
			this.tipExtraCollapsed = true;
			this.faultEditState.picking = true;
			this.faultEditState.pickSession = true;
			this.cableTooltip.show = false;
			this.landingTooltip.show = false;
			this.mapTooltipLandingExpandedId = null;
			this.hideLandingTooltip();
			this.hideCableTooltip && this.hideCableTooltip();
			if (this.myChart && this.myChart.dispatchAction) {
				try { this.myChart.dispatchAction({ type: 'hideTip' }); } catch (e) { /* noop */ }
			}
			if (this.isGlobe) {
				this.isGlobe = false;
			}
			if (!this.isMapFullscreen) {
				this.isMapFullscreen = true;
				this.$nextTick(() => this.refreshMapAfterLayout());
			} else {
				this.$nextTick(() => this.onResize());
			}
			this.updateChart();
		},
		handleFaultPointPick(params) {
			if (!this.faultEditState.picking) return false;
			try {
				let coord = null;
				const ev = params && params.event;
				if (!this.isGlobe && this.myChart && this.myChart.convertFromPixel && ev && ev.offsetX != null && ev.offsetY != null) {
					const res = this.myChart.convertFromPixel({ geoIndex: 0 }, [ev.offsetX, ev.offsetY]);
					if (Array.isArray(res) && res.length >= 2 && isFinite(res[0]) && isFinite(res[1])) coord = res;
				}
				if ((!coord || !coord.length) && Array.isArray(params?.value) && params.value.length >= 2) {
					coord = [Number(params.value[0]), Number(params.value[1])];
				}
				if (!coord || !coord.length || !isFinite(coord[0]) || !isFinite(coord[1])) {
					this.faultEditState.error = '未能获取坐标，请重试';
					return true;
				}
				const editLine = this.findCableByEditName(this.faultEditState.cable || '');
				const calcBefore = this.computeDistanceAlongLine(editLine, coord, this.faultEditState.landing || '');
				this.applyFaultPointCoord(coord);
				const hoverPayload = calcBefore ? {
					coord: calcBefore.point,
					distanceKm: calcBefore.distanceKm,
					startName: this.faultEditState.landing || this.faultEditState.landingAlt || '起点',
					path: calcBefore.path,
					toLine: calcBefore.toLine,
					lineId: calcBefore.lineId || (editLine || {}).id
				} : null;
				if (hoverPayload) this.faultPickLast = hoverPayload;
				this.faultPickHover = hoverPayload || this.faultPickLast;
				this.faultPickConfirmVisible = true;
				this.faultPickConfirmInfo = {
					coord: this.faultEditState.pointCoord,
					distance: this.faultEditState.distance
				};
				return true;
			} catch (e) {
				this.faultEditState.error = '打点失败，请重试';
				return true;
			}
		},
		applyFaultPointCoord(coord) {
			const line = this.findCableByEditName(this.faultEditState.cable || '');
			if (!line) {
				this.faultEditState.error = '未找到对应海缆，无法计算距离';
				this.setFaultPointMarkerFromCoord(coord);
				this.updateChart();
				return;
			}
			const calc = this.computeDistanceAlongLine(line, coord, this.faultEditState.landing || '');
			if (!calc) {
				this.faultEditState.error = '无法计算距离，请重新打点';
				this.setFaultPointMarkerFromCoord(coord);
				this.updateChart();
				return;
			}
			const coordStr = this.formatCoordStr(calc.point);
			this.faultEditState.pointCoord = coordStr;
			if (isFinite(calc.distanceKm)) {
				this.faultEditState.distance = calc.distanceKm.toFixed(2);
			}
			this.faultEditState.error = '';
			this.setFaultPointMarkerFromCoord(calc.point);
			this.faultPickPath = calc.path || null;
			const payload = {
				coord: calc.point,
				distanceKm: calc.distanceKm,
				startName: this.faultEditState.landing || this.faultEditState.landingAlt || '起点',
				path: calc.path,
				toLine: calc.toLine,
				lineId: line.id
			};
			this.faultPickLast = payload;
			if (!this.faultPickHover) this.faultPickHover = payload;
			this.updateChart();
		},
		// 地图鼠标移动：打点时多源获取坐标，优先实时测距，失败则恢复上一次有效预览
		onMapMouseMove(params) {
			try {
				if (this.faultEditState.picking) {
					const ev = params && params.event;
					const pixel = (ev && ev.offsetX !== undefined && ev.offsetY !== undefined) ? [ev.offsetX, ev.offsetY] : null;
					let coord = null;
					if (pixel && this.myChart) {
						try {
							if (this.isGlobe) {
								const sIdx = (params && Number.isInteger(params.seriesIndex)) ? params.seriesIndex : 0;
								coord = this.myChart.convertFromPixel({ seriesIndex: sIdx }, pixel);
							} else {
								coord = this.myChart.convertFromPixel({ geoIndex: 0 }, pixel);
							}
						} catch (e) { coord = null; }
					}
					if ((!coord || coord.some(v => !isFinite(v))) && Array.isArray(params?.value) && params.value.length >= 2) {
						coord = [Number(params.value[0]), Number(params.value[1])];
					}
					if ((!coord || coord.some(v => !isFinite(v))) && Array.isArray(params?.data?.value) && params.data.value.length >= 2) {
						coord = [Number(params.data.value[0]), Number(params.data.value[1])];
					}
					if ((!coord || coord.some(v => !isFinite(v))) && Array.isArray(params?.data?.coords) && params.data.coords.length) {
						const first = params.data.coords[0];
						if (Array.isArray(first) && first.length >= 2) coord = [Number(first[0]), Number(first[1])];
					}
					const res = (coord && coord.every(v => isFinite(v))) ? this.computeLiveDistanceForPick(coord) : null;
					const changed = JSON.stringify(res) !== JSON.stringify(this.faultPickHover);
					if (res) {
						if (changed) {
							this.faultPickHover = res;
							this.updateChart();
							if (this.myChart) {
								this.$nextTick(() => {
									try { this.myChart.dispatchAction({ type: 'showTip', seriesId: 'fault-pick-hover', dataIndex: 0 }); } catch (e) { /* noop */ }
								});
							}
						}
					} else if (this.faultPickLast) {
						const restoreChanged = JSON.stringify(this.faultPickLast) !== JSON.stringify(this.faultPickHover);
						if (restoreChanged) {
							this.faultPickHover = { ...this.faultPickLast };
							this.updateChart();
						}
					} else if (!this.faultPickConfirmVisible && !this.faultPickPath) {
						if (this.faultPickHover) {
							this.faultPickHover = null;
							this.updateChart();
						}
					}
					return;
				}
				if (this.faultPickHover) {
					this.faultPickHover = null;
					this.updateChart();
				}
			} catch (e) { this.faultPickHover = null; }
		},
		confirmFaultPickSave() {
			this.faultPickConfirmVisible = false;
			this.faultPickHover = null;
			this.faultEditState.picking = false;
			this.saveFaultEdit();
		},
		continueFaultPick() {
			this.faultPickConfirmVisible = false;
			this.faultPickHover = null;
			this.faultEditState.picking = true;
			if (this.myChart && this.myChart.dispatchAction) {
				try { this.myChart.dispatchAction({ type: 'hideTip' }); } catch (e) { /* noop */ }
			}
		},
		exitFaultPointPick() {
			this.faultPickConfirmVisible = false;
			this.faultPickHover = null;
			this.faultPickLast = null;
			this.faultPickConfirmInfo = null;
			this.faultPickPath = null;
			this.faultEditState.picking = false;
			this.faultEditState.pickSession = false;
			this.faultEditState.error = '';
			// 退出全屏与聚焦
			if (this.isMapFullscreen) {
				this.isMapFullscreen = false;
				this.$nextTick(() => this.refreshMapAfterLayout());
			}
			if (this.focusMode !== 'none') this.clearFocus();
			this.updateChart();
		},
		getFaultPointMarkerCoord() {
			if (this.faultPointMarker && Array.isArray(this.faultPointMarker.coord)) return this.faultPointMarker.coord;
			return this.displayCoordFromStr(this.faultEditState.pointCoord || '');
		},
		// Check if a point lies near the given cable polyline (by sampling vertices)
		isNearLine(coord, lineCoords, thresholdKm = 300) {
			if (!Array.isArray(coord) || coord.length < 2) return false;
			const coords = Array.isArray(lineCoords) ? lineCoords : [];
			if (!coords.length) return false;
			let min = Infinity;
			for (let i = 0; i < coords.length; i++) {
				const c = coords[i];
				if (!Array.isArray(c) || c.length < 2) continue;
				const d = this.distanceKm(coord, c);
				if (d < min) min = d;
				if (min <= thresholdKm) break;
			}
			return min <= thresholdKm;
		},
		// 打点悬停实时测距：返回预览点、距离、路径，离线时不返回结果（保持上一次有效预览）
		computeLiveDistanceForPick(mouseCoord) {
			try {
				if (!this.faultEditState.picking) return null;
				const line = this.findCableByEditName(this.faultEditState.cable || '');
				if (!line || !Array.isArray(line.coords)) return null;
				const startCoord = this.findLandingCoordByName(this.faultEditState.landing || '') || this.findLandingCoordByName(this.faultEditState.landing || this.faultEditState.landingAlt || '');
				if (!startCoord) return null;
				const res = this.computeDistanceFromStart(line, startCoord, mouseCoord, { maxOffsetKm: 30 })
					|| this.computeDistanceFromStart(line, startCoord, mouseCoord, { maxOffsetKm: 80 });
				if (!res || !isFinite(res.toLine)) return null;
				return {
					coord: res.point,
					distanceKm: res.distanceKm,
					startName: this.faultEditState.landing || this.faultEditState.landingAlt || '起点',
					mouseCoord,
					path: res.path,
					toLine: res.toLine,
					lineId: line.id
				};
			} catch (e) { return null; }
		},
		async ensureCableDetail(id) {
			if (!id) return null;
			if (this.cableDetails[id]) return this.cableDetails[id];
			try {
				const url = encodeURI(`海缆数据/cablesub/${id}.json`);
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				this.$set(this.cableDetails, id, json);
				this.updateCableEnrichment(id);
				return json;
			} catch (e) {
				console.warn('加载海缆详情失败', e);
				return null;
			}
		},
		async ensureLandingPointsLoaded() {
			try {
				if (Array.isArray(this.landingPoints) && this.landingPoints.length > 0) return true;
				await this.loadLandingPoints();
				return true;
			} catch (e) { return false; }
		},
		renderMapTooltip(p) {
			if (!p || !p.data) return '';
			const wrapExtra = (bodyHtml) => {
				if (!bodyHtml) return '';
				if (!this.faultEditState.picking) return bodyHtml;
				const collapsed = this.tipExtraCollapsed !== false;
				const mask = collapsed
					? `<div class="tip-extra-mask" data-action="expand-extra" style="position:absolute; inset:0; background:rgba(6,12,24,0.58); border:1px dashed rgba(0,229,255,0.5); display:flex; align-items:center; justify-content:center; color:#9ce1ff; font-weight:800; letter-spacing:0.5px; cursor:pointer;">展开更多</div>`
					: '';
				const bodyStyle = collapsed ? 'display:none;' : '';
				return `<div class="tip-extra${collapsed ? ' collapsed' : ''}" data-section="tip-extra" style="position:relative; margin-top:10px;">${mask}<div class="tip-extra-body" style="${bodyStyle}">${bodyHtml}</div></div>`;
			};
			const renderLiveDistance = () => {
				if (!this.faultEditState.picking || !this.faultPickHover) return '';
				const src = this.faultPickHover;
				const dist = src.distanceKm != null ? Number(src.distanceKm).toFixed(2) : '-';
				const name = src.startName || '起点';
				const coord = Array.isArray(src.coord || src.value) ? (src.coord || src.value) : [];
				const lon = isFinite(coord[0]) ? Number(coord[0]).toFixed(4) : '-';
				const lat = isFinite(coord[1]) ? Number(coord[1]).toFixed(4) : '-';
				return `<div class="live-distance" data-section="live-distance" style="position:relative; border:1px solid #00e5ff; box-shadow:0 0 14px rgba(0,229,255,0.48); border-radius:10px; padding:10px 12px; margin-bottom:10px; background:linear-gradient(135deg, rgba(0,229,255,0.14), rgba(0,229,255,0.03));">
					<div class="ld-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-weight:800; color:#9ce1ff; letter-spacing:0.5px;">
						<span class="title">测距概览</span>
					</div>
					<div class="ld-body">
						<div class="row"><div class="key">实时距离</div><div class="val" style="color:#00e5ff;font-weight:bold;">${dist} km</div></div>
						<div class="row"><div class="key">涉及登陆站（起点）</div><div class="val">${name}</div></div>
						<div class="row"><div class="key">经纬度</div><div class="val">Lon ${lon}, Lat ${lat}</div></div>
					</div>
				</div>`;
			};
			if (p.seriesType === 'lines' || p.seriesType === 'lines3D') {
				const line = p.data.lineData || {};
				const detail = p.data.detail || this.cableDetails[line.id] || {};
				const needFetch = (!p.data.detail && line.id && !this.cableDetails[line.id]);
				if (needFetch) { this.ensureCableDetail(line.id); }
				// 注意：p.data.landings 在初次渲染时可能是空数组（truthy），会短路导致始终为 0
				// 修正为：仅在 p.data.landings 非空时使用它；否则用最新的详情计算
				const allLandings = ((Array.isArray(p.data.landings) && p.data.landings.length)
					? p.data.landings
					: (this.normalizeLandingPoints(detail) || []));
				const landings = allLandings;
				const contVal = (Array.isArray(line.continents) && line.continents.length) ? line.continents : (line.continent || detail.continent || '');
				const continentText = this.displayContinents(contVal) || this.displayMacroRegion(contVal) || '-';
				const directionText = this.displayDirection(line.direction || detail.direction);
				const chips = landings.map(lp => {
					const ctry = this.translateCountryToZh(this.normalizeText(lp.country || lp.nation || lp.country_name || '-'));
					const name = this.normalizeText(lp.name || '');
					const safeName = name.replace(/\"/g, '&quot;').replace(/"/g, '&quot;');
					const idAttr = lp.id ? ` data-id="${lp.id}"` : '';
					return `<div class="chip" data-action="focus-landing"${idAttr} data-name="${safeName}"><span class="name">${safeName}</span><span class="meta">${ctry}</span></div>`;
				}).join('');
				const count = allLandings.length;
				const color = this.ownershipColor(line.ownership || '非权益');
				const typePillStyle = this.styleStr(this.typeThemeStyle('cable'));
				const ownPillStyle = this.styleStr(this.pillThemeStyle('cable', line));
				const chipWrapCls = `chips scrollable ${count > 4 ? 'collapsed' : ''}`;
				const live = renderLiveDistance();
				const head = `<div class="map-tip"><div class="title">`
					+ `<span class=\"pill\" style=\"${typePillStyle}\">海缆</span>`
					+ `${line.name || '海缆'}${line.ownership ? `<span class=\"pill\" style=\"${ownPillStyle}\">${line.ownership}</span>` : ''}</div>`
					+ (live || '');
				const extra = `<div class="row"><div class="key">商用年</div><div class="val">${detail.rfs_year || '-'}</div></div>`
					+ `<div class="row"><div class="key">长度</div><div class="val">${detail.length || '-'}</div></div>`
					+ `<div class="row"><div class="key">局向</div><div class="val">${directionText}</div></div>`
					+ `<div class="row"><div class="key">洲别</div><div class="val">${continentText}</div></div>`
					+ `<div class="row"><div class="key">海缆经过点</div><div class="val">${count} 个</div></div>`
					+ (chips ? `<div class="${chipWrapCls}">${chips}</div>` : '')
					+ (count > 4 ? `<div class="more" data-action="expand-chip-list">还有 ${count - 4} 个…</div>` : '')
					+ (needFetch ? `<div class="loading">详情加载中…</div>` : '');
				return head + wrapExtra(extra) + `</div>`;
			}
			if (p.seriesType === 'scatter' || p.seriesType === 'effectScatter' || p.seriesType === 'scatter3D') {
				const lp = p.data.lpData || {};
				const detail = p.data.detail || this.stationDetails[lp.id] || {};
				const needFetch = (!p.data.detail && lp.id && !this.stationDetails[lp.id]);
				if (needFetch) { this.fetchStationDetail(lp); }
				const cables = (detail.cables || lp.cables || []);
				const chips = cables.map(cb => {
					const name = this.normalizeText(cb.name || '');
					const safeName = name.replace(/\"/g, '&quot;').replace(/"/g, '&quot;');
					const idAttr = cb.id ? ` data-id="${cb.id}"` : '';
					const checked = (this.landingTooltip && Array.isArray(this.landingTooltip.selectedCableIds)) ? this.landingTooltip.selectedCableIds.map(String).includes(String(cb.id || cb.name)) : true;
					return `<div class="chip"${idAttr} data-name="${safeName}" style="cursor:default;">
                                <label style="display:inline-flex;align-items:center;gap:6px;">
                                    <input type="checkbox" ${checked ? 'checked' : ''} data-action="toggle-cable-select"${idAttr} data-name="${safeName}">
                                    <span class="name">${safeName}</span>
                                </label>
                                <span class="meta">${cb.rfs_year || '-'}${cb.is_planned ? ' · 规划中' : ''}</span>
                            </div>`;
				}).join('');
				const coord = Array.isArray(p.value) ? p.value : lp.coords || [];
				const lon = isFinite(coord[0]) ? Number(coord[0]).toFixed(2) : '-';
				const lat = isFinite(coord[1]) ? Number(coord[1]).toFixed(2) : '-';
				const count = (detail.cables && detail.cables.length) || (lp.cables && lp.cables.length) || 0;
				const country = this.translateCountryToZh(this.normalizeText(lp.country || detail.country || detail.国家 || detail.COUNTRY || detail.Country));
				const contVal = lp.continent || detail.continent || lp.continentMacro || detail.continentMacro || '';
				const continentText = this.displayContinents(contVal) || this.displayMacroRegion(contVal) || '-';
				const directionText = this.displayDirection(lp.direction || detail.direction);
				const ownership = lp.ownership || '';
				const isTbd = (lp.is_tbd !== undefined) ? (lp.is_tbd ? '是' : '否') : (detail.is_tbd !== undefined ? (detail.is_tbd ? '是' : '否') : '-');
				const idText = lp.id || detail.id || '-';
				const isLanding = !!lp && !!lp.id;
				const landingIdStr = lp.id ? String(lp.id) : '';
				const expanded = count > 4 && landingIdStr && this.mapTooltipLandingExpandedId === landingIdStr;
				const chipWrapCls2 = `chips scrollable ${count > 4 && !expanded ? 'collapsed' : ''}`;
				if (!isLanding) {
					// 非登陆站（如海缆路径节点）的散点
					return `<div class="map-tip"><div class="title">海缆经过点</div>`
						+ `<div class="row"><div class="key">经纬度</div><div class="val">Lon ${lon}, Lat ${lat}</div></div>`
						+ `</div>`;
				}
				const titleName = this.displayLandingName(lp);
				const color = this.ownershipColor(ownership || '非权益');
				const typePillStyle = this.styleStr(this.typeThemeStyle('landing'));
				const ownPillStyle = this.styleStr(this.pillThemeStyle('landing', { ownership }));
				const safeLandingName = this.normalizeText(titleName).replace(/"/g, '&quot;');
				const tipAttrs = [];
				if (landingIdStr) tipAttrs.push(`data-lp-id="${landingIdStr}"`);
				if (safeLandingName) tipAttrs.push(`data-lp-name="${safeLandingName}"`);
				const tipAttrStr = tipAttrs.length ? ` ${tipAttrs.join(' ')}` : '';
				const live = renderLiveDistance();
				const head = `<div class="map-tip"${tipAttrStr}><div class="title">`
					+ `<span class=\"pill\" style=\"${typePillStyle}\">登陆站</span>`
					+ `${titleName}${country ? `<span class=\"pill\">${country}</span>` : ''}`
					+ `${ownership ? `<span class=\"pill\" style=\"${ownPillStyle}\">${ownership}</span>` : ''}`
					+ `</div>`
					+ (live || '');
				const extra = `<div class="row"><div class="key">编号</div><div class="val">${idText}</div></div>`
					+ `<div class="row"><div class="key">是否待定</div><div class="val">${isTbd}</div></div>`
					+ `<div class="row"><div class="key">经纬度</div><div class="val">Lon ${lon}, Lat ${lat}</div></div>`
					+ `<div class="row"><div class="key">局向</div><div class="val">${directionText}</div></div>`
					+ `<div class="row"><div class="key">洲别</div><div class="val">${continentText}</div></div>`
					+ `<div class="row"><div class="key">关联海缆</div><div class="val">${count} 条`
					+ `<button class="inline-btn" data-action="select-all-associated"${tipAttrStr} style="margin-left:8px;">全选</button>`
					+ `<button class="inline-btn" data-action="select-none-associated"${tipAttrStr} style="margin-left:8px;">全不选</button>`
					+ `</div></div>`
					+ (chips ? `<div class="${chipWrapCls2}">${chips}</div>` : '')
					+ (count > 4 && !expanded ? `<div class="more" data-action="expand-chip-list" data-landing-id="${landingIdStr}">还有 ${count - 4} 条…</div>` : '')
					+ (needFetch ? `<div class="loading">详情加载中…</div>` : '');
				return head + wrapExtra(extra) + `</div>`;
			}
			return `<div class="map-tip"><div class="title">${p.name || ''}</div></div>`;
		},
		buildLandingPointsForMap(linesFallback) {
			// 地图层登陆站点：默认仅显示权益（自建/合建/租用），可通过 landingOwnershipOnly 切换
			const full = Array.isArray(this.landingPoints) && this.landingPoints.length ? this.landingPoints : [];
			if (full.length) {
				const allowed = new Set(['自建', '合建', '租用', '非权益']);
				const filtered = this.landingOwnershipOnly
					? full.filter(lp => lp && allowed.has(lp.ownership || '非权益') && (lp.ownership || '非权益') !== '非权益')
					: full;
				return filtered
					.filter(lp => Array.isArray(lp.coords) && lp.coords.length >= 2)
					.map(lp => ({
						name: this.normalizeText(lp.name || '登陆站'),
						value: this.isGlobe ? (lp.coords_globe || lp.coords) : lp.coords,
						lpData: lp,
						detail: this.stationDetails[lp.id] || null,
						itemStyle: { color: this.ownershipColor(lp.ownership || '非权益') }
					}));
			}
			const fallbackLines = Array.isArray(linesFallback) && linesFallback.length ? linesFallback : this.filteredCablesMap;
			return this.rebuildPoints(fallbackLines);
		},
		buildLandingPointsForLine(line) {
			if (!line) return [];
			const detail = this.cableDetails[line.id] || this.cableDetail.detail || line.detail || {};
			const landings = this.normalizeLandingPoints(detail);
			const pts = [];
			const nameIndex = new Map();
			this.landingPoints.forEach(p => { const k = this.formatLandingName(p.name).toLowerCase(); if (k) nameIndex.set(k, p); });
			let hasNear = false;
			const fallbackMatches = [];
			const findLanding = (lp) => {
				if (!lp) return null;
				const norm = this.formatLandingName(lp.name).toLowerCase();
				// Prefer exact id match, then exact normalized name match
				const byId = (lp.id) ? (this.landingPoints.find(p => p.id === lp.id) || this.displayLandings.find(p => p.id === lp.id)) : null;
				const byName = nameIndex.get(norm) || null;
				const candidate = byId || byName;
				if (!candidate || !Array.isArray(candidate.coords)) return null;
				const candCoord = this.isGlobe ? (candidate.coords_globe || candidate.coords) : candidate.coords;
				const lineCoords = this.isGlobe ? (line.coords_globe || line.coords) : line.coords;
				if (this.isNearLine(candCoord, lineCoords)) { hasNear = true; return candidate; }
				fallbackMatches.push(candidate);
				return null;
			};
			landings.forEach(lp => {
				const match = findLanding(lp);
				if (match && Array.isArray(match.coords) && match.coords.length >= 2) {
					pts.push({
						name: this.normalizeText(match.name || lp.name || '登陆站'),
						value: this.isGlobe ? (match.coords_globe || match.coords) : match.coords,
						lpData: match,
						detail: this.stationDetails[match.id] || null,
						itemStyle: { color: this.ownershipColor(match.ownership || '非权益') }
					});
				}
			});
			// 若未找到近线登陆站，退化为匹配到的候选（即便未贴合线段）
			if (!pts.length && fallbackMatches.length) {
				fallbackMatches.forEach(match => {
					if (Array.isArray(match.coords) && match.coords.length >= 2) {
						pts.push({
							name: this.normalizeText(match.name || '登陆站'),
							value: this.isGlobe ? (match.coords_globe || match.coords) : match.coords,
							lpData: match,
							detail: this.stationDetails[match.id] || null,
							itemStyle: { color: this.ownershipColor(match.ownership || '非权益') }
						});
					}
				});
			}
			// Ensure endpoints are included to visually connect with line
			if (Array.isArray(line.coords) && line.coords.length >= 2) {
				const srcCoords = this.isGlobe ? (line.coords_globe || line.coords) : line.coords;
				const ends = [srcCoords[0], srcCoords[srcCoords.length - 1]];
				const exists = (coord) => pts.some(p => Array.isArray(p.value) && Math.abs((p.value[0] || 0) - (coord[0] || 0)) < 1e-6 && Math.abs((p.value[1] || 0) - (coord[1] || 0)) < 1e-6);
				ends.forEach((coord, idx) => {
					if (!Array.isArray(coord) || coord.length < 2) return;
					if (!exists(coord)) {
						const color = this.ownershipColor(line.ownership || '非权益');
						pts.push({ name: this.normalizeText(idx === 0 ? `${line.name}-起点` : `${line.name}-终点`), value: coord, lineData: line, itemStyle: { color } });
					}
				});
			}
			if (!pts.length && Array.isArray(line.coords)) {
				const color = this.ownershipColor(line.ownership || '非权益');
				const src = this.isGlobe ? (line.coords_globe || line.coords) : line.coords;
				src.forEach((coord, idx) => {
					pts.push({ name: this.normalizeText(idx === 0 ? `${line.name}-起点` : `${line.name}-终点`), value: coord, lineData: line, itemStyle: { color } });
				});
			}
			return pts;
		},
		buildFaultLocationPoints(fault) {
			if (!fault) return [];
			const entries = [
				{ landing: fault.involvedLanding1, distance: fault.distance1 },
				{ landing: fault.involvedLanding2, distance: fault.distance2 },
				{ landing: fault.involvedLanding3, distance: fault.distance3 }
			];
			const list = Array.isArray(this.landingPoints) ? this.landingPoints : [];
			const nameIndex = new Map();
			list.forEach(p => { const k = this.formatLandingName(p.name).toLowerCase(); if (k) nameIndex.set(k, p); });
			return entries
				.filter(item => item.landing)
				.map(item => {
					const norm = this.formatLandingName(item.landing).toLowerCase();
					const match = nameIndex.get(norm) || list.find(lp => lp.id && this.formatLandingName(lp.id).toLowerCase() === norm) || null;
					if (!match || !Array.isArray(match.coords)) return null;
					const coords = this.isGlobe ? (match.coords_globe || match.coords) : match.coords;
					return {
						name: this.normalizeText(match.name || item.landing),
						value: coords,
						lpData: match,
						isFaultLocation: true,
						distance: item.distance,
						itemStyle: { color: '#ff9900' },
						symbolSize: 12,
						label: {
							show: true,
							position: 'right',
							color: '#ff9900',
							fontWeight: 'bold',
							formatter: () => item.distance ? `${match.name || item.landing} ${item.distance}` : (match.name || item.landing)
						}
					};
				})
				.filter(Boolean);
		},
		buildAllFaultLocationPoints() {
			const list = [];
			(this.displayFaults || []).forEach(f => {
				const pts = this.buildFaultLocationPoints(f) || [];
				if (pts.length) list.push(...pts);
			});
			return list;
		},
		landingCount(detail) {
			return this.normalizeLandingPoints(detail).length;
		},
		buildCoords(geomCoords) {
			const coords = [];
			if (!Array.isArray(geomCoords) || !geomCoords.length) return coords;
			const pushPt = (pt) => {
				if (!Array.isArray(pt) || pt.length < 2) return;
				const lon = Number(pt[0]);
				const lat = Number(pt[1]);
				if (!isFinite(lon) || !isFinite(lat)) return;
				coords.push(this.translationLng([lon, lat]));
			};
			const first = geomCoords[0];
			// LineString: [[lon,lat], [lon,lat], ...]
			if (Array.isArray(first) && first.length === 2 && isFinite(first[0])) {
				geomCoords.forEach(pushPt);
				return coords;
			}
			// MultiLineString: [[[lon,lat],...], [...]]
			geomCoords.forEach(seg => {
				if (!Array.isArray(seg)) return;
				if (Array.isArray(seg[0]) && seg[0].length === 2 && isFinite(seg[0][0])) {
					seg.forEach(pushPt);
				} else {
					// deeper nesting fallback
					seg.forEach(inner => Array.isArray(inner) && inner.forEach(pushPt));
				}
			});
			return coords;
		},
		// 保留 MultiLineString 的分段（2D 平面，含经度跳变>180切段与经度平移）
		buildSegments(geomCoords) {
			const segments = [];
			if (!Array.isArray(geomCoords) || !geomCoords.length) return segments;
			const toPt = (pt) => {
				if (!Array.isArray(pt) || pt.length < 2) return null;
				const lon = Number(pt[0]);
				const lat = Number(pt[1]);
				if (!isFinite(lon) || !isFinite(lat)) return null;
				return this.translationLng([lon, lat]);
			};
			const pushCurrent = (cur) => { if (cur.length >= 2) segments.push(cur.slice()); };
			const first = geomCoords[0];
			// LineString：需要在经度跳变>180时切段
			if (Array.isArray(first) && first.length === 2 && isFinite(first[0])) {
				let current = [];
				geomCoords.forEach(raw => {
					const p = toPt(raw);
					if (!p) return;
					if (!current.length) { current.push(p); return; }
					const prev = current[current.length - 1];
					const dx = Math.abs(Number(p[0]) - Number(prev[0]));
					if (dx > 180) { pushCurrent(current); current = [p]; }
					else { current.push(p); }
				});
				pushCurrent(current);
				return segments;
			}
			// MultiLineString：每个子段同样按>180切分
			geomCoords.forEach(seg => {
				if (!Array.isArray(seg)) return;
				let current = [];
				seg.forEach(raw => {
					const p = toPt(raw);
					if (!p) return;
					if (!current.length) { current.push(p); return; }
					const prev = current[current.length - 1];
					const dx = Math.abs(Number(p[0]) - Number(prev[0]));
					if (dx > 180) { pushCurrent(current); current = [p]; }
					else { current.push(p); }
				});
				pushCurrent(current);
			});
			return segments;
		},
		// Globe 模式分段（3D 地球，不做经度平移，也不按>180切分，直接按原始坐标）
		buildSegmentsRaw(geomCoords) {
			const segments = [];
			if (!Array.isArray(geomCoords) || !geomCoords.length) return segments;
			const toPt = (pt) => {
				if (!Array.isArray(pt) || pt.length < 2) return null;
				const lon = Number(pt[0]);
				const lat = Number(pt[1]);
				if (!isFinite(lon) || !isFinite(lat)) return null;
				return [lon, lat];
			};
			const first = geomCoords[0];
			if (Array.isArray(first) && first.length === 2 && isFinite(first[0])) {
				const cur = [];
				geomCoords.forEach(raw => { const p = toPt(raw); if (p) cur.push(p); });
				if (cur.length >= 2) segments.push(cur);
				return segments;
			}
			geomCoords.forEach(seg => {
				if (!Array.isArray(seg)) return;
				const cur = [];
				seg.forEach(raw => { const p = toPt(raw); if (p) cur.push(p); });
				if (cur.length >= 2) segments.push(cur);
			});
			return segments;
		},
		// 展开经度避免跨 180° 的跳变，用于 Globe
		unwrapSegment(segment, ref) {
			const res = [];
			if (!Array.isArray(segment) || segment.length < 2) return res;
			let prev = Array.isArray(ref) ? ref : null;
			segment.forEach(pt => {
				if (!Array.isArray(pt) || pt.length < 2) return;
				let lon = Number(pt[0]);
				let lat = Number(pt[1]);
				if (!isFinite(lon) || !isFinite(lat)) return;
				if (prev) {
					const diff = lon - prev[0];
					if (diff > 180) lon -= 360;
					else if (diff < -180) lon += 360;
				}
				res.push([lon, lat]);
				prev = [lon, lat];
			});
			return res;
		},
		// 将跨太平洋的多段串联，避免太平洋断裂
		mergeSegmentsAcrossPacific(segments) {
			if (!Array.isArray(segments) || !segments.length) return [];
			const merged = [];
			let anchor = null;
			segments.forEach(seg => {
				const unwrapped = this.unwrapSegment(seg, anchor);
				if (!unwrapped.length) return;
				merged.push(...unwrapped);
				anchor = merged[merged.length - 1];
			});
			return merged.length >= 2 ? [merged] : [];
		},
		unwrapSegmentsChain(segments) {
			const res = [];
			let anchor = null;
			(Array.isArray(segments) ? segments : []).forEach(seg => {
				const un = this.unwrapSegment(seg, anchor);
				if (un.length) {
					res.push(un);
					anchor = un[un.length - 1];
				}
			});
			return res;
		},
		mergeIfDateline(segments) {
			if (!Array.isArray(segments) || !segments.length) return segments || [];
			const flat = segments.flat();
			if (!flat.length) return segments;
			const lons = flat.map(p => Number(p[0])).filter(isFinite);
			if (!lons.length) return segments;
			const span = Math.max(...lons) - Math.min(...lons);
			if (span > 260) {
				const merged = [];
				segments.forEach(s => { if (Array.isArray(s)) merged.push(...s); });
				return merged.length ? [merged] : segments;
			}
			return segments;
		},
		transformFeature(f, ownershipMap) {
			if (!f || !f.geometry) return null;
			const props = f.properties || {};
			const segments2d = this.buildSegments(f.geometry.coordinates);
			const coords2d = segments2d.flat();
			const segments3dRaw = this.buildSegmentsRaw(f.geometry.coordinates);
			let segments3d = this.unwrapSegmentsChain(segments3dRaw).filter(s => Array.isArray(s) && s.length >= 2);
			segments3d = this.mergeIfDateline(segments3d);
			let coords3d = segments3d.flat();
			const coords = coords2d.length ? coords2d : coords3d;
			if (!coords.length) return null;
			// 区分：详情/权益使用 id，几何绘制使用 feature_id
			const id = props.id || props.name;
			const featureId = props.feature_id || id;
			const holder = ownershipMap.get(id) || ownershipMap.get(props.name) || 0;
			const ownershipRaw = this.mapOwnershipLabel(holder) || props.ownership || props.rights || '';
			const ownershipLabel = ownershipRaw || '非权益';
			const start = segments2d[0]?.[0] || coords[0];
			const end = (segments2d[segments2d.length - 1]?.[segments2d[segments2d.length - 1].length - 1]) || coords[coords.length - 1] || start;
			const contA = Array.isArray(start) ? this.continentByLonLat(start[0], start[1]) : null;
			const contB = Array.isArray(end) ? this.continentByLonLat(end[0], end[1]) : null;
			const direction = this.directionLabelForContinents(contA, contB);
			const continentMacro = this.deriveMacroRegionFromCoords(coords);
			const type = (() => {
				if (contA && contB) {
					if (contA === contB) return '区域互联';
					const pair = [contA, contB].sort().join('-');
					if (pair === '亚洲-北美洲') return '跨太平洋';
					if (pair === '亚洲-欧洲') return '亚欧互联';
					return '其他';
				}
				return '其他';
			})();
			if (type === '跨太平洋') {
				const merged = this.mergeSegmentsAcrossPacific(segments3dRaw);
				if (merged && merged.length) {
					segments3d = merged.map(seg => this.unwrapSegment(seg));
					coords3d = segments3d.flat();
				}
			}
			return {
				id,
				feature_id: featureId,
				name: props.name || id || '未命名海缆',
				status: 'ok',
				type,
				continent: continentMacro,
				continents: [...new Set([contA, contB].filter(Boolean))],
				direction,
				coords: coords2d,
				segments: segments2d,
				coords_globe: coords3d,
				segments_globe: segments3d,
				color: this.ownershipColor(ownershipLabel) || props.color,
				is_holder: holder,
				ownership: ownershipRaw,
				ownershipClass: this.ownershipClass(ownershipLabel)
			};
		},
		transformFeatureStandard(f, ownershipMap) {
			if (!f || !f.geometry) return null;
			const props = f.properties || {};
			// 标准地图：不做经度平移，直接使用原始坐标分段
			const segments2d = this.buildSegmentsRaw(f.geometry.coordinates);
			const coords2d = segments2d.flat();
			const segments3dRaw = this.buildSegmentsRaw(f.geometry.coordinates);
			let segments3d = this.unwrapSegmentsChain(segments3dRaw).filter(s => Array.isArray(s) && s.length >= 2);
			segments3d = this.mergeIfDateline(segments3d);
			let coords3d = segments3d.flat();
			if (!coords2d.length && coords3d.length) {
				coords2d.push(...coords3d);
			}
			const id = props.id || props.name;
			const featureId = props.feature_id || id;
			const holder = ownershipMap.get(id) || ownershipMap.get(props.name) || 0;
			const ownershipRaw = this.mapOwnershipLabel(holder) || props.ownership || props.rights || '';
			const ownershipLabel = ownershipRaw || '非权益';
			const start = segments2d[0]?.[0] || coords2d[0];
			const end = (segments2d[segments2d.length - 1]?.[segments2d[segments2d.length - 1].length - 1]) || coords2d[coords2d.length - 1] || start;
			const contA = Array.isArray(start) ? this.continentByLonLat(start[0], start[1]) : null;
			const contB = Array.isArray(end) ? this.continentByLonLat(end[0], end[1]) : null;
			const direction = this.directionLabelForContinents(contA, contB);
			const continentMacro = this.deriveMacroRegionFromCoords(coords2d);
			const type = (() => {
				if (contA && contB) {
					if (contA === contB) return '区域互联';
					const pair = [contA, contB].sort().join('-');
					if (pair === '亚洲-北美洲') return '跨太平洋';
					if (pair === '亚洲-欧洲') return '亚欧互联';
					return '其他';
				}
				return '其他';
			})();
			return {
				id,
				feature_id: featureId,
				name: props.name || id || '未命名海缆',
				status: 'ok',
				type,
				continent: continentMacro,
				continents: [...new Set([contA, contB].filter(Boolean))],
				direction,
				coords: coords2d,
				segments: segments2d,
				coords_globe: coords3d,
				segments_globe: segments3d,
				color: this.ownershipColor(ownershipLabel) || props.color,
				is_holder: holder,
				ownership: ownershipRaw,
				ownershipClass: this.ownershipClass(ownershipLabel)
			};
		},
		applyLandingCountry(id, country) {
			if (!id || !country) return;
			const lp = this.landingPoints.find(p => p.id === id);
			if (lp) this.$set(lp, 'country', country);
			if (this.landingDetail.lp && this.landingDetail.lp.id === id) this.$set(this.landingDetail.lp, 'country', country);
			if (this.landingTooltip.lp && this.landingTooltip.lp.id === id) this.$set(this.landingTooltip.lp, 'country', country);
		},
		openHelp() {
			this.helpVisible = true;
			this.mapDialOpen = false;
		},
		closeHelp() {
			this.helpVisible = false;
		},
		// 一键实况脚本：按预设步骤串行执行模式切换与叠加，保持大屏/紧凑、2D/3D、聚焦/打点的兼容性
		async startPcLiveMode() {
			await this.startLiveScenario('pc');
		},
		async startBigScreenLiveMode() {
			await this.startLiveScenario('big-screen');
		},
		// 单按钮切换：同一模式再次点击视为停止
		stopPcLiveMode() {
			this.stopLiveScenario('pc');
		},
		stopBigScreenLiveMode() {
			this.stopLiveScenario('big-screen');
		},
		// 故障面板快捷入口：根据当前布局切换对应实况模式（紧凑→PC，大屏→大屏）
		toggleFaultPanelLiveScenario() {
			const targetMode = this.isCompactMode ? 'pc' : 'big-screen';
			if (this.liveScenarioMode === targetMode) {
				this.stopLiveScenario(targetMode);
				return;
			}
			this.startLiveScenario(targetMode);
		},
		async startLiveScenario(kind = 'pc') {
			if (this.liveScenarioRunning) return;
			if (this.liveScenarioMode && this.liveScenarioMode === kind) return;
			await this.waitModeSwitchIdle();
			this.liveScenarioRunning = true;
			this.liveScenarioAbort = false;
			this.liveScenarioMode = kind;
			this.liveScenarioPrevAutoRotate = this.autoRotate;
			this.liveScenarioPrevAutoRotateSpeed = this.autoRotateSpeed;
			this.mapDialOpen = false;
			if (this.faultEditState?.picking) this.exitFaultPointPick();
			const steps = [];
			if (kind === 'pc') {
				steps.push({ text: 'PC 实况：进入全屏…', wait: 520, action: async () => { if (!this.isMapFullscreen) this.toggleFullscreen(); } });
			} else {
				steps.push({ text: '大屏实况：退出全屏…', wait: 520, action: async () => { if (this.isMapFullscreen) this.toggleFullscreen(); } });
			}
			steps.push({ text: kind === 'pc' ? 'PC 实况：切换 3D 模式…' : '大屏实况：切换 3D 模式…', wait: 640, action: async () => { if (!this.isGlobe) await this.toggleGlobe(); else await this.uiFlush(); } });
			steps.push({ text: kind === 'pc' ? 'PC 实况：退出聚焦…' : '大屏实况：退出聚焦…', wait: 320, action: async () => { this.clearFocus(); this.focusTargetCoord = null; this.focusedFaultLineIds = []; this.focusedLanding = null; this.focusedCableId = null; this.updateChart(); } });
			steps.push({ text: kind === 'pc' ? 'PC 实况：叠加所有故障…' : '大屏实况：叠加所有故障…', wait: 320, action: async () => { this.showFaultCablesOnMap = true; this.updateChart(); } });
			steps.push({ text: kind === 'pc' ? 'PC 实况：开启自转…' : '大屏实况：开启自转…', wait: 320, action: async () => {
					// 实况自转默认提速至 10，兼容 2D/3D/紧凑/大屏
					this.autoRotateSpeed = 10;
					this.autoRotate = true;
					this.applyAutoRotateView(this.autoRotateSpeed);
				} });
			steps.push({ text: kind === 'pc' ? 'PC 实况：开启故障列表实况…' : '大屏实况：开启故障列表实况…', wait: 320, action: async () => {
					if (!this.realtimeEnabled) this.toggleRealtime();
					this.realtimeMessage = kind === 'pc' ? 'PC 实况：故障列表实况开启' : '大屏实况：故障列表实况开启';
				} });
			try {
				for (const step of steps) {
					if (this.liveScenarioAbort) break;
					await this.waitModeSwitchIdle();
					this.mapLoading = true;
					this.mapLoadingText = step.text;
					await this.uiFlush();
					await step.action();
					if (this.liveScenarioAbort) break;
					await this.sleep(step.wait || 360);
				}
				if (this.liveScenarioAbort) {
					this.stopLiveScenario(kind, { silentToast: true });
					return;
				}
				this.mapLoadingText = '实况已准备完成';
				await this.uiFlush();
			} catch (e) {
				this.notifyToast('实况模式执行失败，请重试', 'error');
				this.stopLiveScenario(kind, { silentToast: true });
			} finally {
				setTimeout(() => {
					this.mapLoading = false;
					this.mapLoadingText = '';
				}, 360);
				this.liveScenarioRunning = false;
			}
		},
		// 停止实况模式：还原自转参数并清空运行状态
		stopLiveScenario(kind = null, opts = {}) {
			const options = { silentToast: false, ...opts };
			this.liveScenarioAbort = true;
			this.liveScenarioRunning = false;
			this.mapLoading = false;
			this.mapLoadingText = '';
			this.autoRotate = this.liveScenarioPrevAutoRotate || false;
			this.autoRotateSpeed = this.liveScenarioPrevAutoRotateSpeed || 0.9;
			this.applyAutoRotateView(this.autoRotate ? this.autoRotateSpeed : 0);
			const label = kind === 'big-screen' ? '大屏' : 'PC';
			if (!options.silentToast) this.notifyToast(`${label} 实况已停止`, 'success');
			this.liveScenarioMode = null;
		},
		toggleMapDial() {
			this.mapDialOpen = !this.mapDialOpen;
		},
		onThreeDRebuildModeChange() {
			// 切换 3D 重算模式：清空缓存并重绘
			this._globeRebuildCache = {};
			const mode = this.threeDRebuildMode;
			const isRecompute = mode && mode.startsWith('recompute');
			const engineLabel = this.engineLabelFromMode(mode);
			if (isRecompute) {
				this.notifyToast(`3D 重算并保存（${engineLabel}）：开始处理，请稍候…`, 'info');
			} else if (mode === 'saved') {
				this.notifyToast('3D 加载已保存：开始加载请稍候…', 'info');
			}
			this.updateChart();
		},
		onThreeDArcStepChange() {
			// 切换弧段步距：清空缓存并按当前模式刷新 3D 数据
			this._globeRebuildCache = {};
			if (!this.isGlobe) return;
			this.loadCableData().catch(() => { });
		},
		toggleFullscreen() {
			if (this.modeSwitching) return;
			if (this.faultEditState?.picking && this.isMapFullscreen) {
				this.exitFaultPointPick();
				return;
			}
			// 进入/退出全屏时，若处于故障聚焦，模拟“先退出聚焦→切换→再恢复”，避免地图被清空
			const shouldRestoreFault = this.focusMode === 'fault';
			const savedFault = shouldRestoreFault ? (this.selectedFault || null) : null;
			const savedFaultIds = shouldRestoreFault && Array.isArray(this.focusedFaultLineIds) ? [...this.focusedFaultLineIds] : [];
			if (shouldRestoreFault) {
				try { this.clearFocus(); } catch (e) { /* noop */ }
			}
			this.mapDialOpen = false;
			this.modeSwitching = true;
			try {
				this.isMapFullscreen = !this.isMapFullscreen;
				this.$nextTick(() => {
					this.refreshMapAfterLayout();
					// 切换布局后在多次重绘稳定后尝试恢复故障聚焦
					if (shouldRestoreFault) {
						const attemptRestore = () => this._restoreFaultFocus(savedFault, savedFaultIds);
						setTimeout(attemptRestore, 180);
						setTimeout(attemptRestore, 420);
						setTimeout(attemptRestore, 900);
					}
				});
			} finally {
				setTimeout(() => { this.modeSwitching = false; }, 200);
			}
		},
		async toggleGlobe() {
			if (this.modeSwitching) return;
			this.modeSwitching = true;
			try {
				this.isGlobe = !this.isGlobe;
				const firstEnterGlobe = this.isGlobe && !this.globeInitFocusedOnce;
				if (firstEnterGlobe) {
					this.mapLoading = true;
					this.mapLoadingText = '预加载 3D 纹理…';
				}
				if (this.isGlobe) {
					await this.ensureGlobeTextures();
					if (firstEnterGlobe) {
						this.mapLoadingText = '加载 3D 海缆数据…';
					}
				}
				// 切换维度后重新加载数据以匹配 2D/3D 字段
				if (firstEnterGlobe) {
					this.mapLoadingText = '初始化 3D 场景…';
				}
				await this.loadCableData();
				// 切换后立即按当前筛选重绘，保留聚焦/筛选状态
				this.updateChart();
				this.$nextTick(() => this.updateChart());
				// 同步滑条
				this.statesToSlider();
				// 首次进入 3D：自动聚焦第一条海缆，再退出聚焦，稳定视角（仅一次）
				if (this.isGlobe && !this.globeInitFocusedOnce) {
					// 显示模拟进度
					this.mapLoading = true;
					this.mapLoadingText = '正在进入 3D 模式…';
					this.$nextTick(() => {
						setTimeout(() => {
							try {
								this.mapLoadingText = '正在聚焦首条海缆…';
								const first = (Array.isArray(this.filteredCablesMap) && this.filteredCablesMap.length)
									? this.filteredCablesMap[0]
									: (Array.isArray(this.withMetrics) && this.withMetrics.length ? this.withMetrics[0] : null);
								if (!first || !this.isGlobe) { this.mapLoading = false; return; }
								this.focusCable(first);
								// 允许一次重绘将视角设置到该海缆，然后退出聚焦但保留视角
								setTimeout(() => {
									try {
										if (!this.isGlobe) { this.mapLoading = false; return; }
										this.mapLoadingText = '正在退出聚焦并开启故障叠加…';
										this.clearFocus();
										this.showFaultCablesOnMap = true;
										this.updateChart();
										setTimeout(() => {
											this.globeInitFocusedOnce = true;
											this.mapLoading = false;
											this.mapLoadingText = '';
										}, 320);
									} catch (e) { this.mapLoading = false; }
								}, 540);
							} catch (e) { this.mapLoading = false; }
						}, 360);
					});
				}
			} finally {
				this.modeSwitching = false;
			}
		},
		// 切换 3D 自转：先显示 loading（双 RAF），再应用视角参数，最后提示
		async toggleAutoRotate() {
			const turningOn = !this.autoRotate;
			this.mapLoading = true;
			this.mapLoadingText = turningOn ? '正在开启自转…' : '正在关闭自转…';
			await this.uiFlush();
			this.autoRotate = turningOn;
			this.applyAutoRotateView(this.autoRotateSpeed);
			setTimeout(() => {
				this.mapLoading = false;
				this.mapLoadingText = '';
				this.notifyToast(turningOn ? '已开启自转' : '已关闭自转', 'success');
			}, 220);
		},
		toggleLegend() {
			this.legendVisible = !this.legendVisible;
			this.updateChart();
		},
		// Agent 入口：占位功能，点击弹出提示
		openAgent() {
			this.notifyToast('Agent 功能敬请期待', 'info', 'Agent');
		},
		toggleCompactMode() {
			if (this.modeSwitching) return;
			this.modeSwitching = true;
			try {
				// 如果当前处于故障聚焦，暂存状态以便切换后恢复
				const shouldRestoreFault = this.focusMode === 'fault';
				const savedFault = shouldRestoreFault ? (this.selectedFault || null) : null;
				const savedFaultIds = shouldRestoreFault && Array.isArray(this.focusedFaultLineIds) ? [...this.focusedFaultLineIds] : [];
				if (shouldRestoreFault) {
					try { this.clearFocus(); } catch (e) { /* noop */ }
				}
				this.userToggledCompact = true;
				this.isCompactMode = !this.isCompactMode;
				this.compactCollapsed = false;
				this.faultOverlayMode = false;
				if (this.myChart) {
					try { this.myChart.dispose(); } catch (e) { }
					this.myChart = null;
					this.chartEventTarget = null;
				}
				this.$nextTick(() => {
					this.refreshMapAfterLayout();
					// 切换布局后在多次重绘稳定后尝试恢复故障聚焦
					if (shouldRestoreFault) {
						const attemptRestore = () => this._restoreFaultFocus(savedFault, savedFaultIds);
						setTimeout(attemptRestore, 180);
						setTimeout(attemptRestore, 420);
						setTimeout(attemptRestore, 900);
					}
				});
			} finally {
				setTimeout(() => { this.modeSwitching = false; }, 300);
			}
		},
		// 在模式切换后恢复故障聚焦（若存在）
		_restoreFaultFocus(fault, faultIds) {
			try {
				const mapEl = this.$refs.map || document.getElementById('worldCableMap');
				const ready = !!(this.myChart && mapEl && mapEl.clientWidth > 0 && mapEl.clientHeight > 0);
				if (!ready) return;
				if (fault) {
					this.focusFaultOnMap(fault);
					return;
				}
				if (Array.isArray(faultIds) && faultIds.length) {
					this.focusMode = 'fault';
					this.focusedFaultLineIds = [...faultIds];
					this.focusedCableId = null;
					this.focusedFeatureId = null;
					this.focusedLanding = null;
					this.updateChart();
				}
			} catch (e) { /* noop */ }
		},
		// 重置布局到默认值，并清除本地持久化
		resetLayout() {
			try {
				// 清除本地持久化
				localStorage.removeItem('dp6.layout.leftPanePct');
				localStorage.removeItem('dp6.layout.topHeightPct');
				localStorage.removeItem('dp6.layout.compactPanelWidth');
				localStorage.removeItem('dp6.layout.screenCols');
				['cable', 'landing', 'fault'].forEach(t => {
					try { localStorage.removeItem(`dp6.fp.${t}`); } catch (e) { }
				});
				// 恢复默认状态
				this.leftPanePct = 50;
				this.topHeightPct = 55;
				this.compactPanelWidth = 420;
				this.leftColPct = 16.7;
				this.centerColPct = 50.0;
				this.rightColPct = 32.7;
				this.floatingPanel.active = false;
				this.floatingPanel.type = null;
				// 触发重绘
				this.$nextTick(() => {
					this.onResize();
					this.refreshMapAfterLayout();
				});
			} catch (e) { /* noop */ }
		},
		refreshMapAfterLayout() {
			try {
				const ensureSize = () => {
					const mapEl = this.$refs.map || document.getElementById('worldCableMap');
					const parent = mapEl && mapEl.parentElement;
					const minH = Math.max(360, (window.innerHeight || 900) - 180);
					if (parent) {
						if (parent.clientHeight < minH) parent.style.minHeight = `${minH}px`;
						parent.style.width = '100%';
					}
					if (mapEl) {
						if (mapEl.clientHeight < minH) mapEl.style.minHeight = `${minH}px`;
						mapEl.style.width = '100%';
					}
				};
				const redraw = () => {
					ensureSize();
					this.ensureChartInstance();
					this.onResize();
					this.updateChart();
				};
				redraw();
				if (typeof requestAnimationFrame === 'function') requestAnimationFrame(redraw); else setTimeout(redraw, 16);
				setTimeout(redraw, 80);
				setTimeout(redraw, 180);
				setTimeout(redraw, 360);
				setTimeout(redraw, 720);
			} catch (e) { /* noop */ }
		},
		setCompactTab(tab) {
			this.compactActiveTab = tab;
		},
		detectCompactMode() {
			// 首次加载默认紧凑：除非宽度超过 3000px 才用大屏
			const shouldCompact = (window.innerWidth || 0) <= 3000;
			if (!this.userToggledCompact) {
				if (this.isCompactMode !== shouldCompact) {
					this.isCompactMode = shouldCompact;
					this.compactCollapsed = false;
					this.$nextTick(() => this.onResize());
				}
			}
		},
		// 缩放滑条 → 2D/3D 映射（感知均匀的指数映射，且保持范围不变，滑条居中对应当前默认值）
		sliderToGeoZoom(s) {
			const min = 1.2, max = 250; // 保持支持范围不变
			const t = Math.max(0, Math.min(100, Number(s) || 0)) / 100;
			// 以当前默认 geoZoom=1.8 为滑条中点锚定
			const mid = 1.8;
			const R = max / min;
			const ratio = Math.log(mid / min) / Math.log(R);
			const gamma = (ratio > 0 && isFinite(ratio)) ? (Math.log(ratio) / Math.log(0.5)) : 1;
			const curved = Math.pow(t, gamma);
			const z = min * Math.pow(R, curved);
			return Math.max(min, Math.min(max, z));
		},
		sliderToGlobeDistance(s) {
			const min = 20, max = this.globeMaxDistance || 320; // 保持支持范围不变
			const t = Math.max(0, Math.min(100, Number(s) || 0)) / 100;
			// 以当前默认 globeDistance=130 为滑条中点锚定（右侧为放大，距离变小）
			const mid = 130;
			const r = min / max; // < 1
			const ratio = Math.log(mid / max) / Math.log(r);
			const gamma = (ratio > 0 && isFinite(ratio)) ? (Math.log(ratio) / Math.log(0.5)) : 1;
			const curved = Math.pow(t, gamma);
			const d = max * Math.pow(r, curved);
			return Math.max(min, Math.min(max, d));
		},
		statesToSlider() {
			try {
				if (this.isGlobe) {
					const min = 20, max = this.globeMaxDistance || 320;
					const d = Math.max(min, Math.min(max, this.globeDistance || 130));
					const r = min / max;
					// 以 mid=130 为居中锚定，反算 t
					const mid = 130;
					const ratio = Math.log(mid / max) / Math.log(r);
					const gamma = (ratio > 0 && isFinite(ratio)) ? (Math.log(ratio) / Math.log(0.5)) : 1;
					let t = Math.log(d / max) / Math.log(r);
					t = Math.max(0, Math.min(1, Math.pow(t, 1 / gamma)));
					this.zoomSlider = Math.round(t * 100);
				} else {
					const min = 1.2, max = 250;
					const z = Math.max(min, Math.min(max, this.geoZoom || 1.8));
					const R = max / min;
					// 以 mid=1.8 为居中锚定，反算 t
					const mid = 1.8;
					const ratio = Math.log(mid / min) / Math.log(R);
					const gamma = (ratio > 0 && isFinite(ratio)) ? (Math.log(ratio) / Math.log(0.5)) : 1;
					let t = Math.log(z / min) / Math.log(R);
					t = Math.max(0, Math.min(1, Math.pow(t, 1 / gamma)));
					this.zoomSlider = Math.round(t * 100);
				}
			} catch (e) { /* noop */ }
		},
		onZoomSlider() {
			try {
				const s = this.zoomSlider;
				if (this.isGlobe) {
					const next = this.sliderToGlobeDistance(s);
					this.globeDistance = next;
					this.myChart && this.myChart.setOption({ globe: { viewControl: { distance: next } } });
				} else {
					const next = this.sliderToGeoZoom(s);
					this.geoZoom = next;
					this.myChart && this.myChart.setOption({ geo: { zoom: next } });
				}
			} catch (e) { /* noop */ }
		},
		applyTitleBg(key) {
			const exists = this.titleBgOptions.some(o => o.key === key);
			this.currentTitleBgKey = exists ? key : '蓝色科技风主标题.png';
		},
		// 旧 2D 背景纹理逻辑移除：避免与底色风格重复，统一走 ECharts 配置渲染
		zoomIn() {
			try {
				if (!this.myChart) return;
				if (this.isGlobe) {
					const step = 12;
					const minDist = 20;
					const maxDist = this.globeMaxDistance || 320;
					const next = Math.max(minDist, Math.min(maxDist, (this.globeDistance || 130) - step));
					this.globeDistance = next;
					this.myChart.setOption({ globe: { viewControl: { distance: next } } });
				} else {
					const step = 0.4;
					const minZoom = 1.2;
					const maxZoom = 250;
					const next = Math.max(minZoom, Math.min(maxZoom, (this.geoZoom || 1.8) + step));
					this.geoZoom = next;
					this.myChart.setOption({ geo: { zoom: next } });
				}
			} catch (e) { /* noop */ }
		},
		zoomOut() {
			try {
				if (!this.myChart) return;
				if (this.isGlobe) {
					const step = 12;
					const minDist = 20;
					const maxDist = this.globeMaxDistance || 320;
					const next = Math.max(minDist, Math.min(maxDist, (this.globeDistance || 130) + step));
					this.globeDistance = next;
					this.myChart.setOption({ globe: { viewControl: { distance: next } } });
				} else {
					const step = 0.4;
					const minZoom = 1.2;
					const maxZoom = 250;
					const next = Math.max(minZoom, Math.min(maxZoom, (this.geoZoom || 1.8) - step));
					this.geoZoom = next;
					this.myChart.setOption({ geo: { zoom: next } });
				}
			} catch (e) { /* noop */ }
		},
		centerFocus() {
			try {
				if (!this.myChart || !this.focusTargetCoord || !Array.isArray(this.focusTargetCoord)) return;
				const [cx, cy] = this.focusTargetCoord;
				if (this.isGlobe) {
					this.myChart.setOption({ globe: { viewControl: { targetCoord: [Number(cx), Number(cy)] } } });
				} else {
					this.myChart.setOption({ geo: { center: [Number(cx), Number(cy)] } });
				}
			} catch (e) { /* noop */ }
		},
		// 复位视角：清空聚焦后回到亚太中心，并显示轻量 loading 与提示
		async resetView() {
			if (this.modeSwitching) return;
			this.mapLoading = true;
			this.mapLoadingText = '正在复位视角…';
			await this.uiFlush();
			// 先清空聚焦，避免覆盖目标视角
			this.clearFocus();
			// 关闭自转，回到默认视距与缩放
			this.autoRotate = false;
			this.autoRotateSpeed = 0.9;
			this.geoZoom = 1.8;
			this.globeDistance = 160;
			// 设置亚太中心为目标并更新
			this.focusTargetCoord = this.isGlobe ? [120, 20] : null;
			this.updateChart();
			// 强制应用目标与默认角度，确保相机回正
			if (this.isGlobe && this.myChart) {
				try {
					this.myChart.setOption({ globe: { viewControl: {
						targetCoord: [120, 20],
						alpha: 22,
						beta: 115,
						distance: this.globeDistance,
						autoRotate: false,
						autoRotateAfterStill: 1e9
					} } }, false);
				} catch (e) { this.centerFocus(); }
			} else {
				this.centerFocus();
			}
			setTimeout(() => {
				this.mapLoading = false;
				this.mapLoadingText = '';
				this.notifyToast('已复位视角（亚太中心）', 'success');
			}, 320);
		},
		loadImage(url, timeout = 6000) {
			return new Promise((resolve) => {
				try {
					const img = new Image();
					let done = false;
					const timer = setTimeout(() => {
						if (done) return; done = true; resolve({ ok: false, url });
					}, timeout);
					img.onload = () => { if (done) return; done = true; clearTimeout(timer); resolve({ ok: true, url }); };
					img.onerror = () => { if (done) return; done = true; clearTimeout(timer); resolve({ ok: false, url }); };
					img.crossOrigin = 'anonymous';
					img.src = url;
				} catch (e) {
					resolve({ ok: false, url });
				}
			});
		},
		async ensureGlobeTextures() {
			try {
				const localBase = encodeURI('3D 地图资源/world.topo.bathy.200401.jpg');
				const localHeight = encodeURI('3D 地图资源/bathymetry_bw_composite_4k.jpg');
				const baseCandidates = [
					localBase,
					'https://echarts.apache.org/examples/data-gl/asset/world.topo.bathy.200401.jpg',
					'https://cdn.jsdelivr.net/npm/echarts-gl@2/examples/data-gl/asset/world.topo.bathy.200401.jpg'
				];
				const heightCandidates = [
					localHeight,
					'https://echarts.apache.org/examples/data-gl/asset/bathymetry_bw_composite_4k.jpg',
					'https://cdn.jsdelivr.net/npm/echarts-gl@2/examples/data-gl/asset/bathymetry_bw_composite_4k.jpg'
				];
				// 逐个尝试，取第一个可加载的
				let base = '';
				for (const u of baseCandidates) {
					const r = await this.loadImage(u);
					if (r.ok) { base = u; break; }
				}
				let height = '';
				for (const u of heightCandidates) {
					const r = await this.loadImage(u);
					if (r.ok) { height = u; break; }
				}
				this.currentGlobeTextureKey = 'topo';
				this.globeTextures = { base, height, layer: base };
			} catch (e) {
				this.globeTextures = { base: '', height: '', layer: '' };
			}
		},
		applyGlobeTexture(key) {
			const opt = this.globeTextureOptions.find(o => o.key === key);
			if (!opt) return;
			this.currentGlobeTextureKey = key;
			this.globeTextures = { base: opt.base, height: opt.height, layer: opt.layer };
			if (this.isGlobe) {
				this.updateChart();
			}
		},
		goLandingPage() {
			const target = Math.min(Math.max(1, Number(this.landingPageInput) || 1), this.landingTotalPages);
			this.landingPage = target;
		},
		goCablePage() {
			const target = Math.min(Math.max(1, Number(this.cablePageInput) || 1), this.cableTotalPages);
			this.cablePage = target;
		},
		prefetchLandingCountries(list) {
			const items = Array.isArray(list) ? list : this.landingPageItems;
			items.forEach(lp => {
				if (!lp || !lp.id) return;
				const detail = this.stationDetails[lp.id];
				const cachedCountry = detail?.country || detail?.国家 || detail?.COUNTRY || detail?.Country;
				if (cachedCountry) {
					this.applyLandingCountry(lp.id, cachedCountry);
					return;
				}
				const hasCountry = lp.country && lp.country !== '未标注' && lp.country !== '未知';
				if (!hasCountry) this.fetchStationDetail(lp, { onlyCountry: true });
			});
		},
		async fetchCableDetail(line) {
			try {
				const id = line?.id;
				if (!id) return;
				if (this.cableDetails[id]) {
					this.cableDetail.detail = this.cableDetails[id];
					this.cableDetail.loading = false;
					if (this.cableTooltip.show && this.cableTooltip.line?.id === id) {
						this.cableTooltip.detail = this.cableDetails[id];
					}
					return;
				}
				const url = encodeURI(`海缆数据/cablesub/${id}.json`);
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				this.cableDetails[id] = json;
				this.cableDetail.detail = json;
				this.cableDetail.loading = false;
				this.updateCableEnrichment(id);
				if (this.cableTooltip.show && this.cableTooltip.line?.id === id) {
					this.cableTooltip.detail = json;
				}
			} catch (e) {
				console.warn('加载海缆详情失败', e);
				this.cableDetail.loading = false;
			}
		},
		toggleCableDetail(line) {
			if (this.cableDetail.id === line.id) {
				this.cableDetail = { id: null, line: null, detail: null, loading: false, landingLimit: 8 };
				return;
			}
			this.cableDetail = { id: line.id, line, detail: this.cableDetails[line.id] || null, loading: !this.cableDetails[line.id], landingLimit: 8 };
			this.fetchCableDetail(line);
		},
		cableLandingLimited() {
			const detail = this.cableDetail.detail;
			if (!detail) return [];
			const list = this.normalizeLandingPoints(detail);
			if (!list.length) return [];
			const limit = this.cableDetail.landingLimit;
			if (limit === 'all') return list;
			const n = Number(limit) || 8;
			return list.slice(0, n);
		},
		cableLandingVisibleCount() {
			const detail = this.cableDetail.detail;
			if (!detail) return 0;
			const list = this.normalizeLandingPoints(detail);
			if (!list.length) return 0;
			const limit = this.cableDetail.landingLimit;
			if (limit === 'all') return list.length;
			const n = Number(limit) || 8;
			return Math.min(n, list.length);
		},
		isExpanded(id, key) {
			return !!this.textExpand[`${id}-${key}`];
		},
		toggleExpand(id, key) {
			const k = `${id}-${key}`;
			this.$set(this.textExpand, k, !this.textExpand[k]);
		},
		triggerPulse() {
			// 呼吸/限时动效已移除，保留空实现兼容旧调用
		},
		displayOwnerText(id) {
			const expanded = this.isExpanded(id, 'owners');
			const detail = (this.cableDetail.id === id && this.cableDetail.detail) ? this.cableDetail.detail : this.cableDetails[id];
			const raw = (detail && (detail.owners || detail.owner)) || '';
			if (!raw) return '-';
			const lang = this.getItemLang('cable', id);
			const text = String(this.translateEntities(raw, lang));
			if (expanded) return text;
			if (text.length <= 40) return text;
			return text.slice(0, 40);
		},
		needsOwnerEllipsis(id) {
			const detail = (this.cableDetail.id === id && this.cableDetail.detail) ? this.cableDetail.detail : this.cableDetails[id];
			const raw = (detail && (detail.owners || detail.owner)) || '';
			if (!raw) return false;
			const lang = this.getItemLang('cable', id);
			const text = String(this.translateEntities(raw, lang));
			return !this.isExpanded(id, 'owners') && text.length > 40;
		},
		async loadCableData() {
			try {
				// 2D 模式：用存储换算力（默认加载已保存，必要时重算并保存）
				if (!this.isGlobe) {
					const mode2d = this.twoDRebuildMode;
					const isRecompute2d = mode2d && mode2d.startsWith('recompute');
					const useStandard = this.mapVersion !== 'ap-zh';
					if (mode2d === 'saved') {
						const loaded = useStandard ? await this.loadSaved2DStandard() : await this.loadSaved2DAP();
						if (Array.isArray(loaded) && loaded.length) {
							this.cableLines = loaded;
							return;
						}
						// 无已保存文件时，回退到重算并尝试保存两套数据
						const { ap, standard } = await this.compute2DRebuiltFromRaw();
						this.cableLines = useStandard ? standard : ap;
						try {
							const r = await this.persist2DRebuilt(ap, standard);
							this.notifyToast(`2D 加载已保存：未找到文件，已重算并写入（使用：${(r && r.engine) || 'php'}）`, 'success');
						} catch (e) {
							this.notifyToast('2D 加载已保存：保存失败，请联系管理员', 'error');
						}
						return;
					} else if (isRecompute2d) {
						const { ap, standard } = await this.compute2DRebuiltFromRaw();
						this.cableLines = useStandard ? standard : ap;
						try {
							const r = await this.persist2DRebuilt(ap, standard);
							this.notifyToast(`2D 重算并保存：完成并写入（使用：${(r && r.engine) || 'php'}）`, 'success');
						} catch (e) {
							this.notifyToast('2D 重算并保存：保存失败，请联系管理员', 'error');
						}
						return;
					}
				}
				// 3D 模式：默认加载已保存的重算结果，仅在“重算并保存”时更新
				if (this.isGlobe) {
					const mode3d = this.threeDRebuildMode;
					const isRecompute3d = mode3d && mode3d.startsWith('recompute');
					const recomputeAndPersist3D = async () => {
						this.notifyToast('3D 重算并保存：正在重构 3D 海缆数据…', 'info');
						const items3d = await this.compute3DRebuiltFromRaw();
						this.cableLines = items3d;
						try {
							const r = await this.persist3DRebuilt(items3d);
							this.notifyToast(`3D 重算并保存：完成并写入（使用：${(r && r.engine) || 'php'}）`, 'success');
						} catch (e) {
							const reason = e && e.message ? e.message : '保存失败';
							this.notifyToast(`3D 重算并保存：保存失败（${reason}）`, 'error');
						}
					};
					if (mode3d === 'saved') {
						this.notifyToast('3D 加载已保存：正在加载 3D 海缆数据…', 'info');
						const loaded3d = await this.loadSaved3DGlobe().catch(() => []);
						if (Array.isArray(loaded3d) && loaded3d.length) {
							this.cableLines = loaded3d;
							this.notifyToast('3D 加载已保存：3D 海缆数据加载完成', 'success');
							return;
						}
						this.notifyToast('3D 加载已保存：未找到文件，改为重算并保存…', 'warning');
						try {
							await recomputeAndPersist3D();
							return;
						} catch (err) {
							console.warn('3D 重算失败，尝试回退原始数据', err);
						}
					} else if (isRecompute3d) {
						try {
							await recomputeAndPersist3D();
							return;
						} catch (err) {
							console.warn('3D 重算失败，尝试回退原始数据', err);
						}
					}
				}
				// 原始数据流程（3D 模式或选择原始）
				const res = await fetch(encodeURI('海缆数据/cable-geo_v3.json'));
				if (!res.ok) throw new Error(`加载海缆总表失败: HTTP ${res.status}`);
				const json = await res.json();
				const features = Array.isArray(json?.features) ? json.features : [];
				const ownershipMap = this.buildOwnershipMap();
				const mapped = features
					.map(f => this.transformFeature(f, ownershipMap))
					.filter(Boolean)
					.sort((a, b) => (b.is_holder || 0) - (a.is_holder || 0));
				this.cableLines = mapped;
				this.cableLines.forEach(l => {
					const start = Array.isArray(l.coords) && l.coords.length ? l.coords[0] : null;
					const end = Array.isArray(l.coords) && l.coords.length ? l.coords[l.coords.length - 1] : null;
					const a = start ? this.continentByLonLat(start[0], start[1]) : null;
					const b = end ? this.continentByLonLat(end[0], end[1]) : null;
					const dir = this.directionLabelForContinents(a, b);
					const region = this.deriveMacroRegionFromCoords(l.coords);
					this.$set(l, 'direction', dir);
					this.$set(l, 'continent', region);
					this.$set(l, 'continents', [...new Set([a, b].filter(Boolean))]);
					const pair = (a && b) ? [a, b].sort().join('-') : null;
					const type = (!a || !b) ? '其他' : (a === b ? '区域互联' : (pair === '亚洲-北美洲' ? '跨太平洋' : (pair === '亚洲-欧洲' ? '亚欧互联' : '其他')));
					this.$set(l, 'type', type);
				});
			} catch (e) {
				console.warn('加载海缆数据失败', e);
			}
		},
		// 计算 2D 重构结果：返回亚太中心版与标准版两套数据
		async compute2DRebuiltFromRaw() {
			const res = await fetch(encodeURI('海缆数据/cable-geo_v3.json'));
			if (!res.ok) throw new Error(`加载海缆总表失败: HTTP ${res.status}`);
			const json = await res.json();
			const features = Array.isArray(json?.features) ? json.features : [];
			const ownershipMap = this.buildOwnershipMap();
			const mappedAp = features
				.map(f => this.transformFeature(f, ownershipMap))
				.filter(Boolean)
				.sort((a, b) => (b.is_holder || 0) - (a.is_holder || 0));
			const mappedStd = features
				.map(f => this.transformFeatureStandard(f, ownershipMap))
				.filter(Boolean)
				.sort((a, b) => (b.is_holder || 0) - (a.is_holder || 0));
			const minimize = (list) => list.map(l => ({
				id: l.id,
				feature_id: l.feature_id,
				name: l.name,
				status: l.status || 'ok',
				ownership: l.ownership,
				ownershipClass: l.ownershipClass,
				color: l.color,
				continent: l.continent,
				continents: l.continents,
				direction: l.direction,
				type: l.type,
				coords: l.coords,
				segments: Array.isArray(l.segments) ? l.segments : this.splitLineSegments(l.coords)
			}));
			return { ap: minimize(mappedAp), standard: minimize(mappedStd) };
		},
		// 加载已保存的 2D 重算结果（亚太中心版）
		async loadSaved2DAP() {
			try {
				const url = encodeURI('海缆数据/重构的数据/2d亚太中心海缆数据.json');
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) return [];
				const json = await res.json();
				const arr = Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
				return arr.map(l => ({
					...l,
					status: l.status || 'ok',
					ownershipClass: l.ownershipClass || this.ownershipClass(l.ownership || '非权益'),
					color: l.color || this.ownershipColor(l.ownership || '非权益')
				}));
			} catch (e) {
				return [];
			}
		},
		// 加载已保存的 2D 重算结果（标准版）
		async loadSaved2DStandard() {
			try {
				const url = encodeURI('海缆数据/重构的数据/2d标准地图海缆数据.json');
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) return [];
				const json = await res.json();
				const arr = Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
				return arr.map(l => ({
					...l,
					status: l.status || 'ok',
					ownershipClass: l.ownershipClass || this.ownershipClass(l.ownership || '非权益'),
					color: l.color || this.ownershipColor(l.ownership || '非权益')
				}));
			} catch (e) {
				return [];
			}
		},
		// 持久化 2D 重算结果到服务器文件
		async persist2DRebuilt(apItems, standardItems) {
			const preferred = this.enginePreferenceFromMode(this.twoDRebuildMode);
			const engine = await this.resolveEngine(preferred);
			const file = (engine === 'py3')
				? 'save_rebuilt_2d_py3.php'
				: (engine === 'py2')
					? 'save_rebuilt_2d_py2.php'
					: 'save_rebuilt_2d.php';
			const payload = { version: 1, savedAt: Date.now(), ap: apItems, standard: standardItems };
			const ret = await this.postJsonWithFallback(this.buildSaveUrlCandidates(file), payload);
			if (!ret || ret.ok !== true) throw new Error(ret && ret.error || '保存失败');
			return { ...ret, engine };
		},
		async onTwoDRebuildModeChange() {
			if (this.modeSwitching) return;
			this.modeSwitching = true;
			try {
				const mode = this.twoDRebuildMode;
				const isRecompute = mode && mode.startsWith('recompute');
				const engineLabel = this.engineLabelFromMode(mode);
				if (isRecompute) {
					this.notifyToast(`2D 重算并保存（${engineLabel}）：开始处理，请稍候…`, 'info');
				} else if (mode === 'saved') {
					this.notifyToast('2D 加载已保存：开始加载请稍候…', 'info');
				}
				await this.ensureBaseMapForMode();
				await this.loadCableData();
				await this.loadLandingPoints();
				this.updateChart();
				if (isRecompute) {
					this.notifyToast(`2D 重算并保存（${engineLabel}）：已完成并写入文件`, 'success');
				} else if (mode === 'saved') {
					this.notifyToast('2D 加载已保存：已完成加载', 'success');
				}
			} finally {
				this.modeSwitching = false;
			}
		},
		async onMapVersionChange() {
			if (this.modeSwitching) return;
			const prevVersion = this.mapVersionPrev || this.mapVersion;
			const rawCoord = this.parseCoordStr(this.faultEditState?.pointCoord || '');
			const convertedCoord = rawCoord ? this.convertCoordForMapVersion(rawCoord, prevVersion, this.mapVersion) : null;
			const convertedMarker = (!convertedCoord && this.faultPointMarker && Array.isArray(this.faultPointMarker.coord))
				? this.convertCoordForMapVersion(this.faultPointMarker.coord, prevVersion, this.mapVersion)
				: null;
			this.modeSwitching = true;
			try {
				this.mapVersionPrev = this.mapVersion;
				await this.ensureBaseMapForMode();
				await this.loadCableData();
				await this.loadLandingPoints();
				if (convertedCoord) {
					this.setFaultPointMarkerFromCoord(convertedCoord);
					if (this.faultEditState.active && this.faultEditState.cable) {
						try { this.applyFaultPointCoord(convertedCoord); } catch (e) { this.faultEditState.pointCoord = this.formatCoordStr(convertedCoord); }
					} else {
						this.faultEditState.pointCoord = this.formatCoordStr(convertedCoord);
					}
				} else if (convertedMarker) {
					this.setFaultPointMarkerFromCoord(convertedMarker);
					if (this.faultEditState.pointCoord) {
						this.faultEditState.pointCoord = this.formatCoordStr(convertedMarker);
					}
				}
				this.updateChart();
				this.$nextTick(() => {
					try {
						if (this.focusTargetCoord && Array.isArray(this.focusTargetCoord)) {
							if (this.isGlobe) {
								this.myChart && this.myChart.setOption({ globe: { viewControl: { targetCoord: this.focusTargetCoord } } });
							} else {
								const center = this.focusTargetCoord.map(Number);
								const zoom = this.geoZoom || 1.8;
								this.myChart && this.myChart.setOption({ geo: { center, zoom } });
							}
						}
					} catch (e) { /* noop */ }
				});
			} finally {
				this.modeSwitching = false;
			}
		},
		faultApiModeLabel(mode) {
			const reach = this.faultApiReachability[mode.key];
			if (reach === false) return `${mode.name}（不可用）`;
			if (reach === true) return `${mode.name}（可用）`;
			return mode.name;
		},
		isFaultModeDisabled(key) {
			return this.faultApiReachability[key] === false;
		},
		faultApiBaseByMode(key) {
			const mode = this.faultApiModes.find(m => m.key === key);
			if (!mode) return '';
			return `http://${mode.host}/fault_data_url/index.php/customer/cmccFaultPanelv2Agent`;
		},
		resolveFaultApiBase() {
			if (this.isFaultModeDisabled(this.faultApiMode)) return '';
			return this.faultApiBaseByMode(this.faultApiMode);
		},
		async pingApiHost(modeKey, timeoutMs = 2500) {
			const base = this.faultApiBaseByMode(modeKey);
			if (!base) return false;
			const ctrl = new AbortController();
			const timer = setTimeout(() => ctrl.abort(), timeoutMs);
			try {
				const url = `${base}?${encodeURIComponent('故障类型')}=${encodeURIComponent('海缆故障')}`;
				const res = await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store', signal: ctrl.signal });
				return res.ok;
			} catch (e) {
				return false;
			} finally {
				clearTimeout(timer);
			}
		},
		async verifyModeReachable(modeKey, { alertOnFail = false } = {}) {
			const ok = await this.pingApiHost(modeKey);
			this.$set(this.faultApiReachability, modeKey, ok);
			if (!ok && alertOnFail) {
				const mode = this.faultApiModes.find(m => m.key === modeKey);
				const name = mode ? mode.name : modeKey;
				this.notifyToast(`${name} 接口不可用，请检查网络或服务状态`, 'warning');
			}
			return ok;
		},
		async autoDetectFaultApiMode() {
			const targets = this.faultApiModes.filter(m => m.autoDetect);
			await Promise.all(targets.map(m => this.verifyModeReachable(m.key)));
			const preferred = targets.map(m => m.key);
			let next = this.faultApiMode;
			for (const k of preferred) {
				if (this.faultApiReachability[k]) { next = k; break; }
			}
			this.faultApiMode = next;
			this.faultApiModePrev = next;
		},
		// 故障接口探测与演示模式切换
		async verifyAllFaultApisReachable() {
			const modes = Array.isArray(this.faultApiModes) ? this.faultApiModes : [];
			const results = await Promise.all(modes.map(m => this.pingApiHost(m.key).then(ok => ({ key: m.key, ok }))));
			results.forEach(r => {
				if (r.ok) {
					this.$set(this.faultApiReachability, r.key, true);
				} else if (this.faultApiReachability[r.key] !== true) {
					this.$set(this.faultApiReachability, r.key, false);
				}
			});
			return results;
		},
		areAllFaultApisDown(snapshot = null) {
			if (Array.isArray(snapshot) && snapshot.length) return !snapshot.some(r => r && r.ok);
			if (!Array.isArray(this.faultApiModes) || !this.faultApiModes.length) return true;
			return this.faultApiModes.every(m => this.faultApiReachability[m.key] === false);
		},
		buildDemoFaults() {
			const list = Array.isArray(this.demoFaultsPreset) ? this.demoFaultsPreset : [];
			return list.map((f, idx) => ({
				name: this.normalizeText(f.name || f.cableName || f.workOrder || `演示故障${idx + 1}`),
				desc: f.desc || '',
				registrar: f.registrar || '',
				sameRoute: f.sameRoute || '',
				start: f.start || '',
				end: f.end || '',
				workOrder: f.workOrder || '',
				isMajor: f.isMajor,
				cableName: f.cableName || '',
				cause: f.cause || '',
				progress: f.progress || '',
				impact: f.impact || '',
				remark: f.remark || '',
				lastModifier: f.lastModifier || '演示模式',
				faultId: f.faultId || `demo-${idx + 1}`,
				involvedCable1: f.involvedCable1 || '',
				involvedLanding1: f.involvedLanding1 || '',
				distance1: f.distance1 || '',
				pointCoord1: f.pointCoord1 || '',
				involvedCable2: f.involvedCable2 || '',
				involvedLanding2: f.involvedLanding2 || '',
				distance2: f.distance2 || '',
				pointCoord2: f.pointCoord2 || '',
				involvedCable3: f.involvedCable3 || '',
				involvedLanding3: f.involvedLanding3 || '',
				distance3: f.distance3 || '',
				pointCoord3: f.pointCoord3 || '',
				raw: { ...(f.raw || {}), 演示数据: true }
			}));
		},
		enableDemoFaults(source = 'manual') {
			this.useDemoFaults = true;
			this.demoFaultsAuto = source === 'auto';
			this.faultsFromApi = this.buildDemoFaults();
			this.rebuildFaultImpactSets();
			this.realtimeMessage = source === 'auto' ? '接口不可用，已启用演示故障数据' : '已开启演示故障数据';
			this.$nextTick(() => this.updateChart());
		},
		async disableDemoFaults({ reload = false } = {}) {
			this.useDemoFaults = false;
			this.demoFaultsAuto = false;
			this.faultsFromApi = Array.isArray(this.lastRealFaults) ? [...this.lastRealFaults] : [];
			this.rebuildFaultImpactSets();
			this.$nextTick(() => this.updateChart());
			if (reload && (!this.faultsFromApi || !this.faultsFromApi.length)) {
				this.realtimeMessage = '演示故障已关闭，正在尝试拉取真实数据…';
				await this.loadFaults();
			} else if (!reload) {
				this.realtimeMessage = '已恢复真实故障数据';
			}
		},
		async toggleDemoFaults() {
			if (this.useDemoFaults) {
				await this.disableDemoFaults({ reload: true });
			} else {
				this.enableDemoFaults('manual');
			}
		},
		async onFaultApiModeChange() {
			if (this.modeSwitching) return;
			this.modeSwitching = true;
			const key = this.faultApiMode;
			const isLocal = key === 'local-docker' || key === 'local-xampp';
			const ok = await this.verifyModeReachable(key, { alertOnFail: isLocal });
			if (!ok) {
				const rollback = this.faultApiModePrev || 'oa';
				this.faultApiMode = rollback;
				this.modeSwitching = false;
				return;
			}
			this.faultApiModePrev = key;
			await this.loadFaults();
			this.modeSwitching = false;
		},
		normalizeFaultsFromApi(payload) {
			try {
				if (!payload || typeof payload !== 'object') return [];
				const rawList = Array.isArray(payload['海缆故障']) ? payload['海缆故障'] : [];
				return rawList.map((item, idx) => {
					const name = this.normalizeText(item['涉及海缆名称'] || item['故障描述'] || item['工单号'] || `海缆故障${idx + 1}`);
					return {
						name,
						desc: this.normalizeText(item['故障描述'] || ''),
						registrar: item['登记人'] || '',
						sameRoute: item['同路由海缆段'] || '',
						start: item['开始时间'] || '',
						end: item['结束时间'] || '',
						workOrder: item['工单号'] || '',
						isMajor: item['是否重大'],
						cableName: item['涉及海缆名称'] || '',
						cause: item['故障原因'] || '',
						progress: item['处理进展'] || '',
						impact: item['业务影响情况'] || '',
						remark: item['备注'] || '',
						lastModifier: item['大屏最近一次操作用户'] || item['最近一次修改者'] || '',
						faultId: item['ctrr_rsrmD_id'] || item['故障ID'] || item['id'] || item['工单号'] || '',
						involvedCable1: item['涉及海缆1'] || '',
						involvedLanding1: item['故障涉及登陆站1'] || '',
						distance1: item['故障点距离1'] || '',
						involvedCable2: item['涉及海缆2'] || '',
						involvedLanding2: item['故障涉及登陆站2'] || '',
						distance2: item['故障点距离2'] || '',
						involvedCable3: item['涉及海缆3'] || '',
						involvedLanding3: item['故障涉及登陆站3'] || '',
						distance3: item['故障点距离3'] || '',
						pointCoord1: item['故障点经纬度1'] || item['故障点经纬度 1'] || '',
						pointCoord2: item['故障点经纬度2'] || item['故障点经纬度 2'] || '',
						pointCoord3: item['故障点经纬度3'] || item['故障点经纬度 3'] || '',
						raw: item
					};
				}).filter(f => f && f.name);
			} catch (e) {
				return [];
			}
		},
		async loadFaults() {
			this.faultsLoading = true;
			// 提示：开始刷新故障数据（根据当前接口模式），若演示模式开启也要同步提示
			this.realtimeMessage = `正在刷新故障数据（模式：${this.faultApiMode}${this.useDemoFaults ? '，演示模式开启' : ''}）…`;
			try {
				const base = this.resolveFaultApiBase();
				if (!base) throw new Error('无可用故障接口');
				const url = `${base}?${encodeURIComponent('故障类型')}=${encodeURIComponent('海缆故障')}`;
				const res = await fetch(url, { credentials: 'include' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				const list = this.normalizeFaultsFromApi(json);
				this.lastRealFaults = list;
				if (!this.useDemoFaults) {
					this.faultsFromApi = list;
					this.realtimeMessage = `故障数据刷新成功，共 ${list.length} 条`;
				} else {
					// 手动开启演示时仍保留真实数据缓存，避免切换后丢失
					this.realtimeMessage = '已获取真实故障数据，当前演示模式开启中';
				}
				this.$set(this.faultApiReachability, this.faultApiMode, true);
				this.demoFaultsAuto = false;
				// 依据故障数据重建影响集合，用于列表“中断/涉及故障”徽标
				this.rebuildFaultImpactSets();
				// 提示：刷新完成，重置倒计时
				if (this.realtimeEnabled) this.realtimeCountdown = 300;
			} catch (e) {
				this.lastRealFaults = [];
				this.$set(this.faultApiReachability, this.faultApiMode, false);
				let reachSnapshot = [];
				try {
					reachSnapshot = await this.verifyAllFaultApisReachable();
				} catch (err) { /* 探测失败忽略，进入兜底逻辑 */ }
				const allDown = this.areAllFaultApisDown(reachSnapshot);
				if (allDown) {
					this.enableDemoFaults('auto');
					this.realtimeMessage = '所有故障接口不可用，已切换演示故障数据';
					console.warn('故障接口不可用，已启用演示故障数据兜底', e);
				} else if (this.useDemoFaults) {
					// 保持演示模式但不重复提示，确保 2D/3D、聚焦/打点/实况一致可用
					this.enableDemoFaults(this.demoFaultsAuto ? 'auto' : 'manual');
					this.realtimeMessage = '接口异常，继续展示演示故障数据';
				} else {
					this.faultsFromApi = [];
					this.realtimeMessage = '故障数据刷新失败：接口不可达或解析错误';
					this.rebuildFaultImpactSets();
				}
			} finally {
				this.faultsLoading = false;
				this.$nextTick(() => this.updateChart());
			}
		},
		rebuildFaultImpactSets() {
			const src = (Array.isArray(this.faultsFromApi) && this.faultsFromApi.length) ? this.faultsFromApi : (this.displayFaults || []);
			const cableSet = new Set();
			const landingSet = new Set();
			const norm = v => this.normalizeText(v || '').toLowerCase();
			// 1) 海缆：按名称/ID匹配
			(src || []).forEach(f => {
				for (let i = 1; i <= 3; i++) {
					const cv = f[`involvedCable${i}`];
					if (!cv) continue;
					const key = norm(cv);
					if (!key) continue;
					// 名称匹配到现有海缆
					const match = (this.cableLines || []).find(l => {
						const keys = [l.id, l.name, l.feature_id].map(x => norm(x));
						return keys.includes(key);
					});
					if (match) { cableSet.add(match.id || match.name || match.feature_id); }
				}
			});
			// 2) 登陆站：按名称/格式化名称/ID匹配
			(src || []).forEach(f => {
				for (let i = 1; i <= 3; i++) {
					const lv = f[`involvedLanding${i}`];
					if (!lv) continue;
					const key = norm(lv);
					const match = (this.landingPoints || []).find(lp => {
						const names = [lp.name, this.formatLandingName(lp.name), lp.id].map(x => norm(x));
						return names.includes(key);
					});
					if (match && match.id) landingSet.add(match.id);
				}
			});
			// 写入响应式对象
			const cableMap = {}; Array.from(cableSet).forEach(id => cableMap[id] = true);
			const landingMap = {}; Array.from(landingSet).forEach(id => landingMap[id] = true);
			this.faultAffectedCableKeySet = cableMap;
			this.faultInvolvedLandingIdSet = landingMap;
		},
		isCableFaulted(line) {
			if (!line) return false;
			const id = line.id || line.name || line.feature_id;
			if (!id) return false;
			return !!this.faultAffectedCableKeySet[id];
		},
		isLandingInvolved(lp) {
			if (!lp) return false;
			return !!this.faultInvolvedLandingIdSet[lp.id];
		},
		async showLandingTooltip(lp, evt) {
			// 若无详情，先加载
			if (!this.stationDetails[lp.id]) {
				await this.fetchStationDetail(lp);
			}
			const detail = this.stationDetails[lp.id] || null;
			const defaultSelected = (this.focusMode === 'none')
				? this.computeLandingDefaultSelected(detail, lp)
				: (this.landingTooltip && Array.isArray(this.landingTooltip.selectedCableIds) ? this.landingTooltip.selectedCableIds : []);
			this.landingTooltip = {
				show: true,
				left: 0,
				top: 0,
				lp,
				detail,
				expanded: false,
				selectedCableIds: defaultSelected
			};
			this.$nextTick(() => {
				const el = this.$refs.landingTooltip;
				if (el && el.getBoundingClientRect) {
					const rect = el.getBoundingClientRect();
					if (rect && rect.width) this.landingTooltipWidth = rect.width;
				}
				this.positionLandingTooltip(evt);
			});
			this.tipExtraCollapsed = true;
			if (this.focusMode === 'none') this.landingShowAssociated = defaultSelected.length > 0;
		},
		moveLandingTooltip(evt) {
			if (!this.landingTooltip.show) return;
			this.positionLandingTooltip(evt);
		},
		hideLandingTooltip() {
			this.landingTooltip.show = false;
		},
		async showCableTooltip(line, evt) {
			// 若无详情，先加载
			if (!this.cableDetails[line.id]) {
				await this.fetchCableDetail(line);
			}
			const detail = this.cableDetails[line.id] || null;
			this.cableTooltip = {
				show: true,
				left: 0,
				top: 0,
				line,
				detail
			};
			this.$nextTick(() => {
				const el = this.$refs.cableTooltip;
				if (el && el.getBoundingClientRect) {
					const rect = el.getBoundingClientRect();
					if (rect && rect.width) this.cableTooltipWidth = rect.width;
				}
				this.positionCableTooltip(evt);
			});
			this.tipExtraCollapsed = true;
		},
		moveCableTooltip(evt) {
			if (!this.cableTooltip.show) return;
			this.positionCableTooltip(evt);
		},
		hideCableTooltip() {
			this.cableTooltip.show = false;
		},
		positionLandingTooltip(evt) {
			const offset = 12;
			const margin = 12;
			const width = this.landingTooltipWidth || 380;
			const viewport = window.innerWidth || document.documentElement.clientWidth || 1200;
			let left = evt.clientX + offset;
			if (left + width + margin > viewport) {
				left = evt.clientX - width - offset;
			}
			if (left < margin) left = margin;
			const top = evt.clientY + offset;
			this.landingTooltip.left = left;
			this.landingTooltip.top = top;
		},
		positionCableTooltip(evt) {
			const offset = 12;
			const margin = 12;
			const width = this.cableTooltipWidth || 380;
			const viewport = window.innerWidth || document.documentElement.clientWidth || 1200;
			let left = evt.clientX + offset;
			if (left + width + margin > viewport) {
				left = evt.clientX - width - offset;
			}
			if (left < margin) left = margin;
			const top = evt.clientY + offset;
			this.cableTooltip.left = left;
			this.cableTooltip.top = top;
		},
		// 高亮/取消高亮：同一海缆的所有分段
		highlightCableSegments(cableId) {
			try {
				if (!this.myChart || !cableId) return;
				const opt = this.myChart.getOption() || {};
				const series = Array.isArray(opt.series) ? opt.series : [];
				series.forEach((s, si) => {
					const t = (s.type || s.seriesType);
					if ((t !== 'lines' && t !== 'lines3D') || !Array.isArray(s.data)) return;
					s.data.forEach((item, di) => {
						const id = item && item.lineData && (item.lineData.id || item.lineData.feature_id);
						if (String(id) === String(cableId)) {
							this.myChart.dispatchAction({ type: 'highlight', seriesIndex: si, dataIndex: di });
						}
					});
				});
			} catch (e) { /* noop */ }
		},
		// 悬停样式：仅调整线条粗细/透明度，避免整图刷新
		applyHoverStyle(cableId) {
			try {
				if (!this.myChart) return;
				const opt = this.myChart.getOption ? this.myChart.getOption() : null;
				if (!opt || !Array.isArray(opt.series)) return;
				const updates = opt.series.map((s) => {
					const t = (s.type || s.seriesType);
					const tLower = String(t || '').toLowerCase();
					// 仅在 3D 线条上应用悬停粗细调整；2D 交给 highlight/emphasis 处理
					if (tLower !== 'lines3d' || !Array.isArray(s.data)) return {};
					const data = s.data.map(item => {
						const baseW = (item && item.__baseWidth != null) ? item.__baseWidth : (item.lineStyle && item.lineStyle.width != null ? item.lineStyle.width : 3);
						const baseO = (item && item.__baseOpacity != null) ? item.__baseOpacity : (item.lineStyle && item.lineStyle.opacity != null ? item.lineStyle.opacity : 0.82);
						const id = item && item.lineData && (item.lineData.id || item.lineData.feature_id);
						const hovered = cableId && String(id) === String(cableId);
						const wHover = Math.max(baseW + 2, 7);
						const oHover = 1.0;
						const color = (item && item.lineStyle && item.lineStyle.color) || this.ownershipColor((item && item.lineData && item.lineData.ownership) || '非权益');
						return {
							...item,
							lineStyle: hovered ? { ...item.lineStyle, width: wHover, opacity: oHover } : { ...item.lineStyle, width: baseW, opacity: baseO },
							emphasis: { lineStyle: { color, width: Math.max(baseW + 3, 7), opacity: 1 } }
						};
					});
					return { ...s, data };
				});
				this.myChart.setOption({ series: updates }, false, true);
			} catch (e) { /* noop */ }
		},
		downplayCableSegments(cableId) {
			try {
				if (!this.myChart || !cableId) return;
				const opt = this.myChart.getOption() || {};
				const series = Array.isArray(opt.series) ? opt.series : [];
				series.forEach((s, si) => {
					const t = (s.type || s.seriesType);
					if ((t !== 'lines' && t !== 'lines3D') || !Array.isArray(s.data)) return;
					s.data.forEach((item, di) => {
						const id = item && item.lineData && (item.lineData.id || item.lineData.feature_id);
						if (String(id) === String(cableId)) {
							this.myChart.dispatchAction({ type: 'downplay', seriesIndex: si, dataIndex: di });
						}
					});
				});
			} catch (e) { /* noop */ }
		},
		toggleLandingDetail(lp) {
			if (this.landingDetail.id === lp.id) {
				this.landingDetail = { id: null, lp: null, detail: null, loading: false, cableLimit: 8 };
				return;
			}
			this.landingDetail = { id: lp.id, lp, detail: this.stationDetails[lp.id] || null, loading: !this.stationDetails[lp.id], cableLimit: 8 };
			this.fetchStationDetail(lp);
		},
		setLandingCableLimit(val) {
			this.landingDetail.cableLimit = val;
		},
		toggleShowCableLabels() {
			this.showCableLabels = !this.showCableLabels;
			this.updateChart();
		},
		toggleShowLandingLabels() {
			this.showLandingLabels = !this.showLandingLabels;
			this.updateChart();
		},
		openUrl(url) {
			if (!url) return;
			try {
				window.open(url, '_blank');
			} catch (e) { }
		},
		async fetchStationDetail(lp, opts = {}) {
			const { onlyCountry = false } = opts;
			try {
				const id = lp?.id;
				if (!id) return;
				if (this.stationDetails[id]) {
					if (this.landingDetail.id === id) {
						this.landingDetail.detail = this.stationDetails[id];
						this.landingDetail.loading = false;
					}
					if (this.landingTooltip.show && this.landingTooltip.lp?.id === id) {
						this.landingTooltip.detail = this.stationDetails[id];
					}
					return;
				}
				const url = encodeURI(`海缆数据/stationsub/${id}.json`);
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				this.stationDetails[id] = json;
				const detailCountry = json?.country || json?.国家 || json?.COUNTRY || json?.Country;
				if (detailCountry) this.applyLandingCountry(id, detailCountry);
				const lpObj = this.landingPoints.find(p => p.id === id);
				if (lpObj && Array.isArray(lpObj.coords)) {
					const cont = this.computeContinentFor(detailCountry, lpObj.coords);
					const dir = this.computeDirectionFor(lpObj.coords);
					this.$set(lpObj, 'continent', cont);
					this.$set(lpObj, 'direction', dir);
					const mr = this.computeMacroRegionFor(detailCountry, lpObj.coords);
					this.$set(lpObj, 'continentMacro', mr);
				}
				if (this.landingDetail.id === id) {
					this.landingDetail.detail = json;
					this.landingDetail.loading = false;
				}
				if (this.landingTooltip.show && this.landingTooltip.lp?.id === id) {
					this.landingTooltip.detail = json;
					if (this.focusMode === 'none') {
						const fresh = this.computeLandingDefaultSelected(json, this.landingTooltip.lp);
						const cur = Array.isArray(this.landingTooltip.selectedCableIds) ? this.landingTooltip.selectedCableIds : [];
						if (!cur.length || fresh.some(id => !cur.map(String).includes(String(id)))) {
							this.landingTooltip.selectedCableIds = fresh;
							this.landingShowAssociated = fresh.length > 0;
							this.updateChart();
						}
					}
				}
				if (onlyCountry) return;
			} catch (e) {
				if (this.landingDetail) this.landingDetail.loading = false;
				console.warn('加载登陆站关联海缆失败', e);
			}
		},
		prevLandingPage() {
			if (this.landingPage > 1) this.landingPage -= 1;
		},
		nextLandingPage() {
			if (this.landingPage < this.landingTotalPages) this.landingPage += 1;
		},
		prevCablePage() {
			if (this.cablePage > 1) this.cablePage -= 1;
		},
		nextCablePage() {
			if (this.cablePage < this.cableTotalPages) this.cablePage += 1;
		},
		async computeLanding2DRebuilt() {
			const url = encodeURI('海缆数据/landing-point-geo_v3.json');
			const res = await fetch(url, { cache: 'no-store' });
			if (!res.ok) throw new Error(`加载登陆站总表失败: HTTP ${res.status}`);
			const json = await res.json();
			const landingOwnershipMap = this.buildLandingOwnershipFromQuanyi();
			if (!json || !Array.isArray(json.features)) return { ap: [], standard: [] };
			const mapFeature = (f, useStandard = false) => {
				const coords = f?.geometry?.coordinates || [];
				if (!Array.isArray(coords) || coords.length < 2) return null;
				const lon = Number(coords[0]);
				const lat = Number(coords[1]);
				const [tlon, tlat] = useStandard ? [lon, lat] : this.translationLng([lon, lat]);
				const landingId = f?.properties?.id || f?.properties?.name;
				const normLandingId = this.formatLandingName(landingId).toLowerCase();
				const holderFromQuanyi = landingOwnershipMap.get(landingId) || landingOwnershipMap.get(normLandingId);
				const holderFromFile = Number(f?.properties?.is_holder) || 0;
				const holder = holderFromQuanyi || holderFromFile;
				const ownershipRaw = this.mapOwnershipLabel(holder) || f?.properties?.ownership || f?.properties?.rights || '';
				const ownershipLabel = ownershipRaw || '非权益';
				const country = f?.properties?.country || f?.properties?.国家 || f?.properties?.COUNTRY || f?.properties?.Country || '未标注';
				const continentName = this.computeContinentFor(country, [tlon, tlat]);
				const macroRegion = this.computeMacroRegionFor(country, [tlon, tlat]);
				const direction = this.computeDirectionFor([tlon, tlat]);
				return {
					name: f?.properties?.name || f?.properties?.id || '未命名登陆站',
					id: f?.properties?.id,
					is_tbd: f?.properties?.is_tbd,
					properties: f?.properties || {},
					country,
					coords: [tlon, tlat],
					coords_globe: [lon, lat],
					coordStr: `${tlon},${tlat}`,
					coordShort: `${isFinite(tlon) ? tlon.toFixed(2) : tlon},${isFinite(tlat) ? tlat.toFixed(2) : tlat}`,
					ownership: ownershipLabel,
					ownershipClass: this.ownershipClass(ownershipLabel),
					continent: continentName,
					continentMacro: macroRegion,
					direction
				};
			};
			const ap = json.features.map(f => mapFeature(f, false)).filter(Boolean);
			const standard = json.features.map(f => mapFeature(f, true)).filter(Boolean);
			return { ap, standard };
		},
		async loadSavedLandingAP() {
			try {
				const url = encodeURI('海缆数据/重构的数据/2d亚太中心登陆站数据.json');
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) return [];
				const json = await res.json();
				return Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
			} catch (e) {
				return [];
			}
		},
		async loadSavedLandingStandard() {
			try {
				const url = encodeURI('海缆数据/重构的数据/2d标准地图登陆站数据.json');
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok) return [];
				const json = await res.json();
				return Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
			} catch (e) {
				return [];
			}
		},
		async persistLandingRebuilt(apItems, standardItems) {
			const preferred = this.enginePreferenceFromMode(this.twoDRebuildMode);
			const engine = await this.resolveEngine(preferred);
			const file = (engine === 'py3')
				? 'save_rebuilt_landing_2d_py3.php'
				: (engine === 'py2')
					? 'save_rebuilt_landing_2d_py2.php'
					: 'save_rebuilt_landing_2d.php';
			const payload = { version: 1, savedAt: Date.now(), ap: apItems, standard: standardItems };
			const ret = await this.postJsonWithFallback(this.buildSaveUrlCandidates(file), payload);
			if (!ret || ret.ok !== true) throw new Error(ret && ret.error || '保存失败');
			return { ...ret, engine };
		},
		async loadLandingPoints() {
			try {
				if (!this.isGlobe) {
					const useStandard = this.mapVersion !== 'ap-zh';
					if (this.twoDRebuildMode === 'saved') {
						this.notifyToast('2D 加载已保存：正在加载登陆站数据…', 'info');
						const loaded = useStandard ? await this.loadSavedLandingStandard() : await this.loadSavedLandingAP();
						if (Array.isArray(loaded) && loaded.length) {
							this.landingPoints = loaded;
							this.notifyToast('2D 加载已保存：登陆站数据加载完成', 'success');
							return;
						}
						const { ap, standard } = await this.computeLanding2DRebuilt();
						this.landingPoints = useStandard ? standard : ap;
						try {
							const r = await this.persistLandingRebuilt(ap, standard);
							this.notifyToast(`2D 加载已保存：未找到文件，已重算并写入（使用：${(r && r.engine) || 'php'}）`, 'success');
						} catch (e) {
							this.notifyToast('2D 加载已保存：登陆站保存失败，请联系管理员', 'error');
							console.warn('保存登陆站重算结果失败', e);
						}
						return;
					} else if (this.twoDRebuildMode && this.twoDRebuildMode.startsWith('recompute')) {
						const { ap, standard } = await this.computeLanding2DRebuilt();
						this.landingPoints = useStandard ? standard : ap;
						try {
							const r = await this.persistLandingRebuilt(ap, standard);
							this.notifyToast(`2D 重算并保存：登陆站完成并写入（使用：${(r && r.engine) || 'php'}）`, 'success');
						} catch (e) {
							this.notifyToast('2D 重算并保存：登陆站保存失败，请联系管理员', 'error');
							console.warn('保存登陆站重算结果失败', e);
						}
						return;
					}
				}
				const url = encodeURI('海缆数据/landing-point-geo_v3.json');
				const res = await fetch(url);
				if (!res.ok) return;
				const json = await res.json();
				const landingOwnershipMap = this.buildLandingOwnershipFromQuanyi();
				if (json && Array.isArray(json.features)) {
					this.landingPoints = json.features
						.map(f => {
							const coords = f?.geometry?.coordinates || [];
							if (!Array.isArray(coords) || coords.length < 2) return null;
							const lon = Number(coords[0]);
							const lat = Number(coords[1]);
							const [tlon, tlat] = this.translationLng([lon, lat]);
							const landingId = f?.properties?.id || f?.properties?.name;
							const normLandingId = this.formatLandingName(landingId).toLowerCase();
							const holderFromQuanyi = landingOwnershipMap.get(landingId) || landingOwnershipMap.get(normLandingId);
							const holderFromFile = Number(f?.properties?.is_holder) || 0;
							const holder = holderFromQuanyi || holderFromFile;
							const ownershipRaw = this.mapOwnershipLabel(holder) || f?.properties?.ownership || f?.properties?.rights || '';
							const ownershipLabel = ownershipRaw || '非权益';
							const country = f?.properties?.country || f?.properties?.国家 || f?.properties?.COUNTRY || f?.properties?.Country || '未标注';
							const continentName = this.computeContinentFor(country, [tlon, tlat]);
							const macroRegion = this.computeMacroRegionFor(country, [tlon, tlat]);
							const direction = this.computeDirectionFor([tlon, tlat]);
							return {
								name: f?.properties?.name || f?.properties?.id || '未命名登陆站',
								id: f?.properties?.id,
								is_tbd: f?.properties?.is_tbd,
								properties: f?.properties || {},
								country,
								coords: [tlon, tlat],
								coords_globe: [lon, lat],
								coordStr: `${tlon},${tlat}`,
								coordShort: `${isFinite(tlon) ? tlon.toFixed(2) : tlon},${isFinite(tlat) ? tlat.toFixed(2) : tlat}`,
								ownership: ownershipLabel,
								ownershipClass: this.ownershipClass(ownershipLabel),
								continent: continentName,
								continentMacro: macroRegion,
								direction
							};
						})
						.filter(Boolean);
				}
			} catch (err) {
				console.warn('加载登陆站数据失败', err);
			}
		},
		waitForMapReady(maxMs = 2000) {
			return new Promise((resolve) => {
				const start = Date.now();
				const tick = () => {
					if (echarts && echarts.getMap && echarts.getMap('world')) return resolve();
					if (Date.now() - start > maxMs) return resolve();
					requestAnimationFrame(tick);
				};
				tick();
			});
		},
		// 2D 底色主题预设：为不同模式提供明显且专业的底色风格
		mapTextureTheme() {
			const presets = {
				gray: {
					// 灰阶简约：无渐变、低对比边界
					backgroundColor: '#1a1a2e',
					areaGradient: null,
					areaColor: '#2f3f57',
					borderColor: '#496ea4',
					borderWidth: 0.7,
					shadowBlur: 14,
					shadowColor: 'rgba(32,64,96,0.12)',
					emphasisAreaColor: '#165DFF',
					emphasisShadowColor: '#2a8fd0'
				},
				// 多国配色：不同国家不同底色，增强辨识度（不喧宾夺主）
				multination: {
					backgroundColor: '#0f1828',
					areaGradient: null,
					areaColor: '#203248',
					borderColor: '#466888',
					borderWidth: 0.9,
					shadowBlur: 18,
					shadowColor: 'rgba(70,104,136,0.18)',
					emphasisAreaColor: '#2a7ad1',
					emphasisShadowColor: '#48a8ff',
					countryColorFor(name) {
						const palette = ['#345a8a','#4b7aa6','#3b8f8a','#6c7fb1','#7aa96f','#a57ea3','#a88b5e'];
						const idx = Math.abs((name||'').split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)) % palette.length;
						return palette[idx];
					}
				},
				'multination-tech': {
					backgroundColor: '#0b1322',
					areaGradient: null,
					areaColor: '#1a2236',
					borderColor: '#2f6ba0',
					borderWidth: 1.0,
					shadowBlur: 18,
					shadowColor: 'rgba(47,107,160,0.2)',
					emphasisAreaColor: '#3aa0ff',
					emphasisShadowColor: '#3aa0ff',
					countryColorFor(name) {
						const palette = ['#1d7fd9','#00c2ff','#4be0c3','#8f7dff','#ff8bd1','#ffc14d','#5ad1ff'];
						const idx = Math.abs((name||'').split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)) % palette.length;
						return palette[idx];
					}
				},
				'multination-pastel': {
					backgroundColor: '#0f161f',
					areaGradient: null,
					areaColor: '#1e2733',
					borderColor: '#4f6b82',
					borderWidth: 0.9,
					shadowBlur: 16,
					shadowColor: 'rgba(79,107,130,0.16)',
					emphasisAreaColor: '#6fb7ff',
					emphasisShadowColor: '#6fb7ff',
					countryColorFor(name) {
						const palette = ['#7fb3ff','#ffd7a3','#b0e0e6','#c7b8ff','#ffb8c1','#a6e3b8','#ffe08a'];
						const idx = Math.abs((name||'').split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)) % palette.length;
						return palette[idx];
					}
				},
				ink: {
					backgroundColor: '#0b1224',
					areaGradient: [
						{ offset: 0, color: '#1a2d47' },
						{ offset: 0.5, color: '#112c4a' },
						{ offset: 1, color: '#0b1a33' }
					],
					areaColor: '#1c2b45',
					borderColor: '#2d95ff',
					borderWidth: 1.2,
					shadowBlur: 24,
					shadowColor: 'rgba(45,149,255,0.2)',
					emphasisAreaColor: '#247dff',
					emphasisShadowColor: '#2d95ff'
				},
				aurora: {
					backgroundColor: '#0a1a26',
					areaGradient: [
						{ offset: 0, color: '#165a73' },
						{ offset: 0.55, color: '#0fa8b5' },
						{ offset: 1, color: '#0b1f3a' }
					],
					areaColor: '#1e4254',
					borderColor: '#53d6ff',
					borderWidth: 1.3,
					shadowBlur: 24,
					shadowColor: 'rgba(83,214,255,0.24)',
					emphasisAreaColor: '#2fd0ff',
					emphasisShadowColor: '#53d6ff'
				},
				sand: {
					backgroundColor: '#121017',
					areaGradient: [
						{ offset: 0, color: '#3a2f2a' },
						{ offset: 0.5, color: '#6a4a2f' },
						{ offset: 1, color: '#2b1f16' }
					],
					areaColor: '#3d3129',
					borderColor: '#d9ad7c',
					borderWidth: 1.1,
					shadowBlur: 18,
					shadowColor: 'rgba(217,173,124,0.18)',
					emphasisAreaColor: '#f0c07a',
					emphasisShadowColor: 'rgba(240,192,122,0.65)'
				},
				slate: {
					backgroundColor: '#0d1624',
					areaGradient: [
						{ offset: 0, color: '#233142' },
						{ offset: 0.55, color: '#1f2a3c' },
						{ offset: 1, color: '#171e2a' }
					],
					areaColor: '#2a3645',
					borderColor: '#6fa3c8',
					borderWidth: 1.2,
					shadowBlur: 20,
					shadowColor: 'rgba(111,163,200,0.18)',
					emphasisAreaColor: '#7cc0ff',
					emphasisShadowColor: '#6fa3c8'
				},
				cyber: {
					backgroundColor: '#081018',
					areaGradient: [
						{ offset: 0, color: '#15213a' },
						{ offset: 0.5, color: '#0f2c4f' },
						{ offset: 1, color: '#0a162a' }
					],
					areaColor: '#142335',
					borderColor: '#29e0ff',
					borderWidth: 1.25,
					shadowBlur: 24,
					shadowColor: 'rgba(41,224,255,0.2)',
					emphasisAreaColor: '#4ff1ff',
					emphasisShadowColor: 'rgba(79,241,255,0.75)'
				}
			};
			const key = this.mapTextureStyle in presets ? this.mapTextureStyle : 'gray';
			return { ...presets[key], key };
		},
		makeOption(lines, points) {
			const theme = this.mapTextureTheme();
			const legendCfg = this.legendVisible ? {
				show: true,
				orient: 'vertical',
				left: 10,
				top: 60,
				textStyle: { color: '#e8f7ff', fontSize: 12 },
				backgroundColor: 'rgba(8,15,30,0.35)',
				borderColor: 'rgba(72,219,251,0.35)',
				borderWidth: 1,
				itemWidth: 16,
				itemHeight: 10
			} : { show: false };
			return {
				animationDuration: 2000,
				animationEasing: 'cubicInOut',
				animationDelay: idx => idx * 120,
				title: {
					text: '全球海缆运行状态总览', left: 'center', top: 16,
					show: this.isMapFullscreen,
					textStyle: { fontSize: 30, fontWeight: 'bold', color: '#ffe58f', textShadowColor: '#48dbfb', textShadowBlur: 16 }
				},
				legend: legendCfg,
				tooltip: {
					trigger: 'item',
					enterable: true,
					confine: true,
					padding: 12,
					backgroundColor: 'rgba(8,15,30,0.92)',
					borderColor: 'rgba(72,219,251,0.6)',
					borderWidth: 1,
					className: 'sc-tooltip',
					position: (pos, params, dom) => {
						const label = this.getTooltipOwnership(params) || '非权益';
						const color = this.ownershipColor(label);
						const glow = this.hexToRgba(color, 0.28);
						try {
							if (dom && dom.style) {
								dom.style.border = `1px solid ${color}`;
								dom.style.boxShadow = `0 10px 28px rgba(0,0,0,0.38), 0 0 14px ${glow}`;
								dom.style.borderRadius = '12px';
								dom.style.backgroundColor = 'rgba(8,15,30,0.92)';
								dom.style.overflow = 'hidden';
							}
						} catch (e) { }
						return pos;
					},
					extraCssText: 'backdrop-filter:blur(6px);',
					textStyle: { fontSize: 13, color: '#e8f7ff', lineHeight: 20 },
					formatter: params => this.renderMapTooltip(params)
				},
				// 统一使用底色主题的背景色（不再依赖元素背景图）
				backgroundColor: theme.backgroundColor || '#1a1a2e',
				geo: (() => {
					const g = (typeof echarts !== 'undefined' && echarts.graphic) ? echarts.graphic : null;
					const isMulti = ['multination','multination-tech','multination-pastel'].includes(theme.key);
					const areaColor = isMulti ? (theme.areaColor || '#2e4057')
						: (g && theme.areaGradient ? new g.LinearGradient(0, 0, 0, 1, theme.areaGradient) : (theme.areaColor || '#2e4057'));
					const borderColor = theme.borderColor || '#4a6fa5';
					const borderWidth = (theme.borderWidth != null) ? theme.borderWidth : 1;
					const shadow = (theme.shadowBlur != null) ? theme.shadowBlur : 12;
					const shadowColor = theme.shadowColor || 'rgba(72,219,251,0.15)';
					const emphasisAreaColor = theme.emphasisAreaColor || '#165DFF';
					const emphasisShadowColor = theme.emphasisShadowColor || '#48dbfb';
					const base = {
						map: 'world', roam: true, zoom: this.geoZoom || 1.8, center: this.mapCenter(),
						label: { show: true, color: '#dce6ff', fontSize: 12, animationDuration: 1500, animationEasing: 'fadeIn' },
						itemStyle: { areaColor, borderColor, borderWidth, shadowBlur: shadow, shadowColor, animationDuration: 2000 },
						emphasis: { itemStyle: { areaColor: emphasisAreaColor, shadowBlur: Math.max(shadow + 4, 22), shadowColor: emphasisShadowColor, animationDuration: 800, animationEasing: 'elasticOut', animationLoop: true, animationDelay: 0 }, label: { color: '#fff', fontSize: 14 } },
						scaleLimit: { min: 1.2, max: 250 }
					};
					// 多国配色：为各国家应用不同色块
					if (theme.countryColorFor) {
						const world = echarts.getMap && echarts.getMap('world');
						const regions = (world && world.geoJson && Array.isArray(world.geoJson.features))
							? world.geoJson.features.map(f => ({ name: f.properties && f.properties.name, itemStyle: { areaColor: theme.countryColorFor(f.properties && f.properties.name || '') } }))
							: [];
						base.regions = regions;
					} else {
						base.regions = [];
					}
					return base;
				})(),
				series: [
					{
						type: 'lines',
						coordinateSystem: 'geo',
						zlevel: 2,
						polyline: true,
						effect: { show: this.lineEffectEnabled || this.focusMode === 'cable' || this.focusMode === 'fault', constantSpeed: 80, symbol: 'circle', symbolSize: 6, trailLength: 0.06, color: '#c8f7ff' },
						animation: false,
						lineStyle: { width: 3, opacity: 0.3, curveness: 0.15 },
						emphasis: { lineStyle: { opacity: 1, width: 5 } },
						data: lines
					},
					{ type: 'scatter', coordinateSystem: 'geo', zlevel: 3, label: { show: false }, symbolSize: 10, animation: false, itemStyle: { opacity: 0.33 }, emphasis: { scale: true, itemStyle: { opacity: 1, shadowBlur: 10, shadowColor: 'rgba(200, 247, 255, 0.7)' } }, data: points }
				]
			};
		},
		mapCenter() {
			// 亚太中心用 140E，标准地图用 0
			return (this.mapVersion === 'ap-zh') ? [140, 20] : [0, 20];
		},
		loadScript(url) {
			return new Promise((resolve, reject) => {
				try {
					const s = document.createElement('script');
					s.src = url;
					s.async = true;
					s.onload = () => resolve(true);
					s.onerror = () => reject(new Error('script load failed'));
					document.head.appendChild(s);
				} catch (e) { reject(e); }
			});
		},
		async ensureBaseMapForMode() {
			// 根据地图版本加载对应底图脚本（若脚本不可用，静默回退到现有地图）
			try {
				const opt = this.mapVersionOptions.find(o => o.key === this.mapVersion);
				const url = opt ? opt.script : 'js/worldZH（以中国为中心）.js';
				await this.loadScript(url);
			} catch (e) { /* 忽略脚本加载错误，使用现有地图 */ }
		},
		makeOptionGlobe(lines, points, titleText = '全球海缆运行状态总览', targetCoord = null, prevViewControl = null) {
			// 构造 3D 图表配置（初学者指南）
			// 1）将海缆线数据按“故障/正常”拆分；
			// 2）将登陆站按“自建/合建/租用/非权益”分组；
			// 3）按有无数据动态生成系列与图例，避免出现无数据的类别；
			const normalLineData = [];
			const faultLineData = [];
			(Array.isArray(lines) ? lines : []).forEach(item => {
				const color = item.lineStyle?.color || this.ownershipColor(item.lineData?.ownership || '非权益');
				const width = (item.lineStyle && item.lineStyle.width != null) ? item.lineStyle.width : 3;
				const opacity = (item.lineStyle && item.lineStyle.opacity != null) ? item.lineStyle.opacity : 0.82;
				const hovered = !!(this.hoveredCableId && item.lineData && (String(item.lineData.id) === String(this.hoveredCableId) || String(item.lineData.feature_id) === String(this.hoveredCableId)));
				const wHover = Math.max(width + 2, 7);
				const oHover = 1.0;
				const payload = {
					...item,
					coords: item.coords,
					lineData: item.lineData,
					detail: item.detail,
					landings: item.landings,
					__baseWidth: width,
					__baseOpacity: opacity,
					// 3D 线样式仅保留颜色、不透明度与宽度，避免非支持属性影响绘制
					lineStyle: hovered ? { color, width: wHover, opacity: oHover } : { color, width, opacity },
					// 数据级强调，确保 highlight/hover 时线条明显加粗并完全不透明
					emphasis: { lineStyle: { color, width: Math.max(width + 3, 7), opacity: 1 } }
				};
				if (item.fault) faultLineData.push(payload); else normalLineData.push(payload);
			});
			// 3D 故障线改为“红色虚线”：lines3D 不支持原生 dashed，使用分段短线模拟虚线
			const dashedFaultData = (() => {
				const out = [];
				(faultLineData || []).forEach(it => {
					const coords = Array.isArray(it.coords) ? it.coords : [];
					for (let i = 0; i < coords.length - 1; i += 2) {
						const a = coords[i], b = coords[i + 1];
						if (!Array.isArray(a) || !Array.isArray(b)) continue;
						out.push({
							...it,
							coords: [a, b],
							// 保持红色与强调风格
							lineStyle: { width: 3.2, opacity: 1.0, color: '#ff0000' },
							itemStyle: { color: '#ff0000' },
							emphasis: { focus: 'self', lineStyle: { width: 7.0, opacity: 1.0, color: '#ff0000' } }
						});
					}
				});
				return out;
			})();
			// 3D 走线拾取辅助点：沿线均匀撒点用于 hover/click 拾取与交互提示
			const buildPickerPoints = src => {
				const out = [];
				(src || []).forEach(it => {
					const coords = Array.isArray(it.coords) ? it.coords : [];
					if (!coords.length) return;
					const stride = Math.max(3, Math.floor(coords.length / 80));
					for (let i = 0; i < coords.length; i += stride) {
						const c = coords[i];
						if (!Array.isArray(c) || c.length < 2) continue;
						const lon = this.normalizeLon(c[0]);
						const lat = Number(c[1]);
						if (!isFinite(lon) || !isFinite(lat)) continue;
						out.push({
							name: it.name,
							value: [lon, lat],
							lineData: it.lineData,
							detail: it.detail,
							itemStyle: { color: it.lineStyle?.color || '#48dbfb', opacity: 0.06 },
							symbolSize: 7
						});
					}
				});
				return out;
			};
			const pickerPoints = buildPickerPoints(normalLineData).concat(buildPickerPoints(faultLineData));
			const pointDataAll = (Array.isArray(points) ? points : []).map(p => {
				const ownership = (p.lpData && p.lpData.ownership) || (p.lineData && p.lineData.ownership) || '非权益';
				const color = p.itemStyle?.color || this.ownershipColor(ownership);
				const opacity = (p.itemStyle && p.itemStyle.opacity != null) ? p.itemStyle.opacity : 0.9;
				const size = (p.symbolSize != null) ? p.symbolSize : Math.min(18, Math.max(6, this.ownershipLandingSize(ownership)));
				return {
					...p,
					name: p.name,
					value: p.value,
					lpData: p.lpData,
					detail: p.detail,
					lineData: p.lineData,
					itemStyle: { ...p.itemStyle, color, opacity },
					symbolSize: size
				};
			});
			const faultPointData = pointDataAll.filter(p => p && p.isFaultLocation);
			const basePointData = pointDataAll.filter(p => !(p && p.isFaultLocation));
			const prevView = prevViewControl && typeof prevViewControl === 'object' ? { ...prevViewControl } : {};
			const resolvedTarget = (Array.isArray(targetCoord) && targetCoord.length >= 2) ? targetCoord : null;
			const existingTarget = (prevView && Array.isArray(prevView.targetCoord)) ? prevView.targetCoord : null;
			// 初始加载无视角时回退到亚太中心，后续保留上一次视角
			const viewTarget = resolvedTarget || existingTarget || (!prevViewControl ? [120, 20] : null);
			const bright = Math.max(0.2, Math.min(2.5, Number(this.globeGlowBrightness) || 1.0));
			const globe = {
				environment: '#0e1a36',
				shading: 'lambert',
				baseColor: '#3a6ea9',
				light: (() => {
					const style = this.globeGlowStyle;
					// 风格强度映射
					const map = {
						default: { ambient: 1.0, main: 1.4, exposure: 1.6, specular: 0.6 },
						soft:    { ambient: 0.9, main: 1.2, exposure: 1.3, specular: 0.45 },
						cinema:  { ambient: 0.85, main: 1.5, exposure: 1.8, specular: 0.55 },
						noon:    { ambient: 1.2, main: 1.8, exposure: 2.0, specular: 0.65 },
						night:   { ambient: 0.8, main: 1.1, exposure: 1.2, specular: 0.5 }
					};
					const m = map[style] || map.default;
					return {
						ambient: { intensity: this.globeGlowEnabled ? m.ambient * bright : 0.75 },
						main: { intensity: this.globeGlowEnabled ? m.main * bright : 1.0, shadow: false, alpha: 32, beta: 130 },
						ambientCubemap: { exposure: this.globeGlowEnabled ? m.exposure * bright : 1.0, diffuseIntensity: 1.0, specularIntensity: this.globeGlowEnabled ? m.specular * bright : 0.4 }
					};
				})(),
				// 3D 光效风格控制：关闭时同步关掉 bloom 与大气辉光
				postEffect: (() => {
					const style = this.globeGlowStyle;
					const bloomIntensity = {
						default: 0.35,
						soft: 0.25,
						cinema: 0.45,
						noon: 0.5,
						night: 0.3
					}[style] || 0.35;
					return { enable: this.globeGlowEnabled, bloom: { enable: this.globeGlowEnabled, intensity: this.globeGlowEnabled ? bloomIntensity * bright : 0 } };
				})(),
				temporalSuperSampling: { enable: true },
				// 视角控制：保持与上次视角一致；若开启自转则启用 autoRotate
				viewControl: (() => {
					const base = { ...prevView };
					const dist = Math.min(this.globeMaxDistance || 320, (this.globeDistance || base.distance || 130));
					const vc = {
						...base,
						autoRotate: !!this.autoRotate,
						autoRotateAfterStill: this.autoRotate ? 0.25 : 1e9,
						autoRotateSpeed: this.normalizeAutoRotateSpeed(this.autoRotateSpeed || base.autoRotateSpeed || 0.9),
						distance: dist,
						minDistance: 20,
						maxDistance: this.globeMaxDistance || base.maxDistance || 320,
						alpha: base.alpha != null ? base.alpha : 22,
						beta: base.beta != null ? base.beta : 115
					};
					if (viewTarget) vc.targetCoord = viewTarget; else if ('targetCoord' in vc) delete vc.targetCoord;
					return vc;
				})(),
				globeOuterRadius: 100,
				globeRadius: 100,
				atmosphere: this.globeGlowEnabled ? { show: true, color: 'rgba(72,219,251,0.26)' } : { show: false }
			};
			if (this.globeTextures.base) globe.baseTexture = this.globeTextures.base;
			if (this.globeTextures.height) globe.heightTexture = this.globeTextures.height;
			if (this.globeTextures.layer) globe.layerTexture = this.globeTextures.layer;
			// 图例基础样式（3D 模式）
			const legendStyle = {
				show: true,
				orient: 'vertical', left: 10, top: 60,
				textStyle: { color: '#e8f7ff', fontSize: 12 },
				backgroundColor: 'rgba(8,15,30,0.35)', borderColor: 'rgba(72,219,251,0.35)', borderWidth: 1,
				itemWidth: 16, itemHeight: 10
			};
			const baseOpt = {
				backgroundColor: '#162a5f',
				title: {
					text: titleText,
					left: 'center', top: 12,
					show: this.isMapFullscreen,
					textStyle: { fontSize: 28, fontWeight: 'bold', color: '#ffe58f', textShadowColor: '#48dbfb', textShadowBlur: 16 }
				},
				legend: {},
				tooltip: {
					trigger: 'item', enterable: true, confine: true, padding: 12,
					backgroundColor: 'rgba(8,15,30,0.92)', borderColor: 'rgba(72,219,251,0.6)', borderWidth: 1,
					textStyle: { fontSize: 13, color: '#e8f7ff', lineHeight: 20 },
					className: 'sc-tooltip',
					position: (pos, params, dom) => {
						const label = this.getTooltipOwnership(params) || '非权益';
						const color = this.ownershipColor(label);
						const glow = this.hexToRgba(color, 0.28);
						try {
							if (dom && dom.style) {
								dom.style.border = `1px solid ${color}`;
								dom.style.boxShadow = `0 10px 28px rgba(0,0,0,0.38), 0 0 14px ${glow}`;
								dom.style.borderRadius = '12px';
								dom.style.backgroundColor = 'rgba(8,15,30,0.92)';
								dom.style.overflow = 'hidden';
							}
						} catch (e) { }
						return pos;
					},
					formatter: params => this.renderMapTooltip(params)
				},
				globe,
				series: [
					// 3D 海缆按权益分组（将“其他”并入“非权益”）
					...(() => {
						const normOwn = (v) => {
							if (!v || v === '其他') return '非权益';
							return v;
						};
						const groups = { '自建': [], '合建': [], '租用': [], '非权益': [] };
						(normalLineData || []).forEach(it => {
							const label = normOwn((it?.lineData?.ownership) || '非权益');
							if (!groups[label]) groups[label] = [];
							groups[label].push(it);
						});
						// 3D 海缆：按权益分组动态创建系列
						const mk = (label) => ({
							id: `lines3d-${label}`,
							name: `海缆（${label}）`,
							type: 'lines3D', coordinateSystem: 'globe', blendMode: 'source-over',
							polyline: true,
							lineStyle: { width: 3.0, opacity: 0.82, color: this.ownershipColor(label) },
							itemStyle: { color: this.ownershipColor(label) },
							emphasis: { focus: 'self', lineStyle: { width: 8.0, opacity: 1.0 } },
							silent: false,
							effect: { show: this.lineEffectEnabled || this.focusMode === 'cable' || this.focusMode === 'fault', trailWidth: 2.0, trailLength: 0.12, trailColor: '#c8f7ff' },
							data: groups[label] || []
						});
						const arr = [];
						['自建', '合建', '租用', '非权益'].forEach(l => { if ((groups[l] || []).length) arr.push(mk(l)); });
						return arr;
					})(),
					{
						id: 'lines3d-fault',
						type: 'lines3D', coordinateSystem: 'globe', blendMode: 'source-over', name: '海缆（故障）',
						polyline: true,
						lineStyle: { width: 3.2, opacity: 1.0, color: '#ff0000' },
						itemStyle: { color: '#ff0000' },
						emphasis: { focus: 'self', lineStyle: { width: 7.0, opacity: 1.0, color: '#ff0000' } },
						silent: false,
						effect: { show: false },
						data: dashedFaultData
					},
					{
						id: 'line-pickers',
						type: 'scatter3D', coordinateSystem: 'globe',
						label: { show: false },
						symbol: 'circle',
						symbolSize: (val, p) => (p && p.data && p.data.symbolSize) ? p.data.symbolSize : 6,
						itemStyle: { opacity: 0.01 },
						emphasis: { itemStyle: { opacity: 0.95, color: '#c8f7ff', shadowBlur: 20, shadowColor: 'rgba(200, 247, 255, 0.85)' }, symbolSize: 9 },
						silent: false,
						tooltip: {
							show: true,
							formatter: (p) => {
								const mock = { seriesType: 'lines3D', data: { lineData: p?.data?.lineData, detail: p?.data?.detail } };
								return this.renderMapTooltip(mock);
							}
						},
						data: pickerPoints
					},
					// 3D 登陆站按权益分组（将“其他”并入“非权益”）
					...(() => {
						const normOwn = (v) => {
							if (!v || v === '其他') return '非权益';
							return v;
						};
						const groups = { '自建': [], '合建': [], '租用': [], '非权益': [] };
						(basePointData || []).forEach(p => {
							const label = normOwn((p?.lpData?.ownership) || '非权益');
							if (!groups[label]) groups[label] = [];
							groups[label].push(p);
						});
						const mk = (label) => ({
							id: `scatter3d-${label}`,
							name: `登陆站（${label}）`,
							type: 'scatter3D', coordinateSystem: 'globe',
							label: {
								show: (this.focusMode !== 'none') || this.showLandingLabels,
								formatter: p => {
									const d = p && p.data;
									const lp = d && (d.lpData || null);
									if (lp) return this.displayLandingName(lp);
									const name = d && (d.name || '');
									return this.normalizeText(name);
								},
								color: '#fff',
								fontSize: 14,
								backgroundColor: 'rgba(0,0,0,0.35)',
								padding: [4, 6],
								borderRadius: 4,
								distance: 8
							},
							symbolSize: (val, params) => {
								const d = params && params.data;
								const ownership = d?.lpData?.ownership || d?.lineData?.ownership || '非权益';
								return Math.min(18, Math.max(6, this.ownershipLandingSize(ownership)));
							},
							itemStyle: { opacity: 0.9, color: this.ownershipColor(label) },
							emphasis: { scale: true, itemStyle: { opacity: 1, shadowBlur: 20, shadowColor: 'rgba(200, 247, 255, 0.85)' } },
							silent: false,
							data: groups[label]
						});
						// 3D 登陆站：按权益分组动态创建系列
						const arr2 = [];
						['自建', '合建', '租用', '非权益'].forEach(l => { if ((groups[l] || []).length) arr2.push(mk(l)); });
						return arr2;
					})(),
					// 故障涉及登陆站（3D）
					{
						id: 'scatter3d-involved',
						type: 'scatter3D', coordinateSystem: 'globe', name: '',
						label: {
							show: this.focusMode === 'fault',
							formatter: p => {
								const d = p && p.data;
								const lp = d && (d.lpData || null);
								const name = lp ? this.displayLandingName(lp) : (d?.name || '');
								return d?.distance ? `${name} ${d.distance}` : name;
							},
							color: '#ff9900',
							backgroundColor: 'rgba(0,0,0,0.35)',
							padding: [4, 6],
							borderRadius: 4
						},
						symbol: 'circle',
						symbolSize: 13,
						itemStyle: { opacity: 0.95, color: '#ff9900' },
						showEffectOn: 'render',
						rippleEffect: { scale: 3.4, brushType: 'stroke', period: 3.0 },
						emphasis: { scale: true, itemStyle: { opacity: 1, shadowBlur: 16, shadowColor: 'rgba(255,153,0,0.55)' } },
						silent: false,
						data: (() => {
							const src = (Array.isArray(this.faultsFromApi) && this.faultsFromApi.length) ? this.faultsFromApi : (this.displayFaults || []);
							const out = [];
							const norm = v => this.normalizeText(v || '').toLowerCase();
							(src || []).forEach((f, i) => {
								for (let idx = 1; idx <= 3; idx++) {
									const landingRaw = f[`involvedLanding${idx}`] || '';
									const dist = f[`distance${idx}`] || '';
									if (!landingRaw) continue;
									const match = (this.landingPoints || []).find(lp => {
										const names = [lp.name, this.formatLandingName(lp.name), lp.id].map(x => norm(x));
										const target = norm(landingRaw);
										return names.includes(target);
									});
									if (match && Array.isArray(match.coords)) {
										out.push({ name: this.displayLandingName(match), value: match.coords, lpData: match, distance: dist });
									}
								}
							});
							return out;
						})()
					},
					{
						id: 'scatter3d-fault',
						type: 'scatter3D', coordinateSystem: 'globe', name: '故障定位点',
						label: {
							show: true,
							formatter: p => {
								const d = p && p.data;
								const lp = d && (d.lpData || null);
								const name = lp ? this.displayLandingName(lp) : (d?.name || '');
								return d?.distance ? `${name} ${d.distance}` : name;
							},
							color: '#ff4d4f',
							fontWeight: 'bold',
							backgroundColor: 'rgba(0,0,0,0.45)',
							padding: [4, 6],
							borderRadius: 4
						},
						symbol: 'diamond',
						symbolSize: (val, params) => (params?.data?.symbolSize) || 12,
						itemStyle: { opacity: 0.95, color: '#ff4d4f' },
						silent: false,
						data: faultPointData,
						name: '故障定位点与涉及登陆站'
					}
				]
			};
			// 动态图例：仅展示有数据的系列，保持 2D/3D 图例一致性
			const seriesBuilt = baseOpt.series || [];
			const legendData = Array.from(new Set(seriesBuilt.filter(s => {
				const d = s && s.data;
				return Array.isArray(d) ? d.length > 0 : true;
			}).map(s => s && s.name).filter(Boolean)));
			baseOpt.legend = this.legendVisible ? { ...legendStyle, data: legendData } : { show: false };
			return baseOpt;
		},
		rebuildPoints(lines) {
			const pts = [];
			lines.forEach(line => {
				line.coords.forEach((coord, idx) => {
					const color = this.ownershipColor(line.ownership || '非权益');
					pts.push({ name: this.normalizeText(idx === 0 ? `${line.name}-起点` : `${line.name}-终点`), value: coord, itemStyle: { color } });
				});
			});
			return pts;
		},
		splitLineSegments(coords) {
			const segments = [];
			let current = [];
			const pushCurrent = () => { if (current.length >= 2) segments.push(current); current = []; };
			(Array.isArray(coords) ? coords : []).forEach(pt => {
				if (!Array.isArray(pt) || pt.length < 2) return;
				const lon = Number(pt[0]);
				const lat = Number(pt[1]);
				if (!isFinite(lon) || !isFinite(lat)) return;
				if (!current.length) { current.push([lon, lat]); return; }
				const prev = current[current.length - 1];
				const dx = Math.abs(lon - prev[0]);
				if (dx > 180) { pushCurrent(); current.push([lon, lat]); }
				else { current.push([lon, lat]); }
			});
			pushCurrent();
			return segments;
		},
		decorateLines(lines) {
			const items = [];
			lines.forEach(l => {
				const color = this.ownershipColor(l.ownership || '非权益');
				const isFocused = (this.focusMode === 'cable') && this.focusedFeatureId && (l.feature_id === this.focusedFeatureId);
				const detail = this.cableDetails[l.id] || null;
				const landings = this.normalizeLandingPoints(detail);
				let segments = [];
				if (this.isGlobe) {
					segments = this.recomputeGlobeSegments(l);
					if (!segments || !segments.length) {
						segments = (Array.isArray(l.segments_globe) && l.segments_globe.length) ? l.segments_globe : (Array.isArray(l.coords_globe) ? [l.coords_globe] : []);
					}
				} else {
					segments = (Array.isArray(l.segments) && l.segments.length) ? l.segments : this.splitLineSegments(l.coords);
				}
				segments.forEach(seg => {
					items.push({
						name: l.name,
						coords: seg,
						lineData: l,
						detail,
						landings,
						lineStyle: {
							color,
							width: isFocused ? 3 : 3,
							opacity: isFocused ? 0.28 : 0.28,
							curveness: 0.15,
							shadowBlur: 0,
							shadowColor: 'transparent'
						},
						effect: { color }
					});
				});
			});
			return items;
		},
		resolveFaultLines(f) {
			try {
				if (!f) return [];
				const lines = [];
				const seenSig = new Set();
				const norm = (v) => String(v || '').trim().toLowerCase();
				const normalizeCableText = (s) => {
					const t = String(s || '')
						.replace(/[()（）\[\]]/g, ' ')
						.replace(/海缆系统|系统|合建|租用|涉及|\s+/g, ' ')
						.trim()
						.toLowerCase();
					return t;
				};
				const nameFragments = (raw) => {
					if (!raw) return [];
					// 优先用解析出的英文/数字片段，兜底按常见中文分隔符拆分
					const fromParser = this.parseFaultCableNames(raw);
					if (Array.isArray(fromParser) && fromParser.length) return fromParser.map(normalizeCableText);
					return String(raw).split(/[，,、;；\n]+/).map(s => normalizeCableText(s)).filter(Boolean);
				};
				const addLine = (ln) => {
					if (!ln) return;
					const has2d = Array.isArray(ln.coords) && ln.coords.length;
					const has3d = Array.isArray(ln.coords_globe) && ln.coords_globe.length;
					if (!has2d && !has3d && !Array.isArray(ln.segments) && !Array.isArray(ln.segments_globe)) return;
					const key = norm(ln.feature_id || ln.id || ln.name);
					const pickCoords = () => {
						if (Array.isArray(ln.segments) && ln.segments.length) return ln.segments[0];
						if (Array.isArray(ln.coords) && ln.coords.length) return ln.coords;
						if (Array.isArray(ln.segments_globe) && ln.segments_globe.length) return ln.segments_globe[0];
						if (Array.isArray(ln.coords_globe) && ln.coords_globe.length) return ln.coords_globe;
						return null;
					};
					const geom = pickCoords();
					let sig = key;
					if (Array.isArray(geom) && geom.length) {
						const start = geom[0];
						const end = geom[geom.length - 1];
						sig = `${key}|${start?.[0]},${start?.[1]}|${end?.[0]},${end?.[1]}|${geom.length}`;
					}
					if (sig && seenSig.has(sig)) return;
					if (sig) seenSig.add(sig);
					lines.push(ln);
				};
				const allCandidates = [...this.withMetrics, ...this.cableLines, ...this.filteredCablesMap];
				const findLine = (fn) => allCandidates.find(fn);
				const addSiblings = (base) => {
					if (!base) return;
					const baseId = norm(base.id);
					const baseName = norm(base.name);
					const baseFeature = norm(base.feature_id);
					allCandidates.forEach(ln => {
						if (!ln) return;
						const sameId = baseId && norm(ln.id) === baseId;
						const sameFeat = baseFeature && norm(ln.feature_id) === baseFeature;
						const sameName = baseName && norm(ln.name) === baseName;
						if (sameId || sameFeat || sameName) addLine(ln);
					});
				};
				// 若故障对象本身就是一条海缆（本地 err 数据），直接加入
				const isLineLike = (Array.isArray(f.coords) && f.coords.length) || (Array.isArray(f.coords_globe) && f.coords_globe.length) || (Array.isArray(f.segments) && f.segments.length) || (Array.isArray(f.segments_globe) && f.segments_globe.length);
				if (isLineLike) {
					addLine(f);
				}
				const locationCombos = [1, 2, 3].map(idx => ({
					cable: f[`involvedCable${idx}`],
					landing: f[`involvedLanding${idx}`]
				})).filter(item => item.cable);
				// 不再使用“涉及海缆名称”等文本兜底，避免在 123 未填时误画故障走线
				const matchLanding = (line, landingName) => {
					if (!landingName) return true;
					const detail = this.cableDetails[line?.id] || line?.detail || {};
					const list = this.normalizeLandingPoints(detail) || [];
					if (!list.length) return true;
					const target = norm(this.formatLandingName(landingName));
					return list.some(lp => norm(lp.name) === target || norm(lp.id) === target);
				};
				locationCombos.forEach(item => {
					const frags = nameFragments(item.cable);
					if (!frags.length) return;
					// 2Africa 特殊处理：不同分段命名略有差异，统一按名称模糊聚合
					if (frags.some(t => t.includes('2africa'))) {
						allCandidates.forEach(ln => {
							if (!ln) return;
							const name = norm(ln.name);
							if (name.includes('2africa') && matchLanding(ln, item.landing)) addLine(ln);
						});
						return;
					}
					// 先尝试精确匹配 id/feature_id/name
					for (const target of frags) {
						const exact = findLine(l => norm(l.feature_id) === target || norm(l.id) === target || norm(this.normalizeText(l.name || '')) === target || norm(l.name) === target);
						if (exact && matchLanding(exact, item.landing)) { addLine(exact); addSiblings(exact); continue; }
						// 再尝试片段模糊
						const frag = this.findLineByNameFragment(target);
						if (frag && matchLanding(frag, item.landing)) { addLine(frag); addSiblings(frag); }
					}
				});
				if (!locationCombos.length) return lines;
				// IAX 故障排查：若匹配不到多分支，输出一次调试信息便于核对
				const isIaxFault = locationCombos.some(x => normalizeCableText(x.cable).includes('india asia xpress') || normalizeCableText(x.cable).includes('iax'));
				if (isIaxFault && lines.length < 2) {
					console.warn('[IAX故障排查] 仅匹配到', lines.length, '条分支', {
						fragments: locationCombos.map(x => normalizeCableText(x.cable)),
						matched: lines.map(l => l.feature_id || l.id || l.name)
					});
				}
				return lines;
			} catch (e) {
				return [];
			}
		},
		buildFaultLines(opts = {}) {
			try {
				const source = Array.isArray(this.displayFaults) ? this.displayFaults : [];
				const highlightSetRaw = opts?.highlightSet;
				const filterSetRaw = opts?.filterSet;
				const norm = (v) => String(v || '').trim().toLowerCase();
				const toSet = (raw) => {
					if (!raw) return null;
					const arr = Array.isArray(raw) ? raw : Array.from(raw);
					return new Set(arr.map(v => norm(v)).filter(Boolean));
				};
				const highlightSet = toSet(highlightSetRaw);
				const filterSet = toSet(filterSetRaw);
				const inSet = (set, line) => {
					if (!set || !line) return false;
					const keys = [line.feature_id, line.id, line.name].map(norm);
					return keys.some(k => k && set.has(k));
				};
				const seenSeg = new Set();
				const color = '#ff4d4f';
				const items = [];
				source.forEach(f => {
					const lines = this.resolveFaultLines(f);
					lines.forEach(l => {
						const key = norm(l.feature_id || l.id || l.name);
						if (filterSet && !inSet(filterSet, l)) return;
						let segments = [];
						if (this.isGlobe) {
							segments = this.recomputeGlobeSegments(l);
							if (!segments || !segments.length) {
								segments = (Array.isArray(l.segments_globe) && l.segments_globe.length) ? l.segments_globe : (Array.isArray(l.coords_globe) ? [l.coords_globe] : []);
							}
						} else {
							segments = (Array.isArray(l.segments) && l.segments.length) ? l.segments : this.splitLineSegments(l.coords);
						}
						const detail = this.cableDetails[l.id] || null;
						const landings = this.normalizeLandingPoints(detail);
						const highlighted = inSet(highlightSet, l);
						segments.forEach(seg => {
							const start = Array.isArray(seg) && seg.length ? seg[0] : [];
							const end = Array.isArray(seg) && seg.length ? seg[seg.length - 1] : [];
							const sig = `${key}|${start?.[0]},${start?.[1]}|${end?.[0]},${end?.[1]}|${seg.length}`;
							if (sig && seenSeg.has(sig) && !highlightSet) return;
							if (sig) seenSeg.add(sig);
							items.push({
								fault: true,
								name: l.name,
								coords: seg,
								lineData: l,
								detail,
								landings,
								lineStyle: {
									color,
									width: highlighted ? 3.6 : 3.0,
									type: 'dashed',
									opacity: highlighted ? 1 : 0.98,
									curveness: 0.15,
									shadowBlur: highlighted ? 8 : 2,
									shadowColor: highlighted ? 'rgba(255,77,79,0.45)' : 'rgba(255,77,79,0.2)'
								},
								// 数据级强调：hover/highlight 时显著加粗
								emphasis: { lineStyle: { color, width: highlighted ? 9 : 8, opacity: 1 } },
								effect: { color }
							});
						});
					});
				});
				return items;
			} catch (e) {
				console.warn('构建故障海缆高亮失败', e);
				return [];
			}
		},
		async focusCable(line, segCoords) {
			try {
				if (!line || !this.myChart) return;
				// 进入海缆聚焦时，自动关闭“显示所有故障海缆”
				this.showFaultCablesOnMap = false;
				// 切换海缆时关闭故障编辑面板
				this.cancelFaultEdit();
				// 优先以 feature_id 寻找几何；若缺失则回退 id
				const byFeature = (line.feature_id) ? (this.cableLines.find(l => l.feature_id === line.feature_id) || this.withMetrics.find(l => l.feature_id === line.feature_id)) : null;
				const byId = (!byFeature && line.id) ? (this.cableLines.find(l => l.id === line.id) || this.withMetrics.find(l => l.id === line.id)) : null;
				const canonical = byFeature || byId || line;
				const has2d = Array.isArray(canonical.coords) && canonical.coords.length;
				const has3d = Array.isArray(canonical.coords_globe) && canonical.coords_globe.length;
				if (!has2d && !has3d && !Array.isArray(canonical.segments) && !Array.isArray(canonical.segments_globe)) return;
				const baseCoords = has2d ? canonical.coords : (canonical.coords_globe || canonical.coords || line.coords || []);
				this.focusedCableId = canonical.id;          // 详情使用 id
				this.focusedFeatureId = canonical.feature_id; // 绘制使用 feature_id
				this.focusMode = 'cable';
				this.focusedFaultLineIds = [];
				// 确保依赖数据就绪：海缆详情与登陆站
				if (canonical.id) await this.ensureCableDetail(canonical.id);
				await this.ensureLandingPointsLoaded();
				this.triggerPulse();
				const chooseSeg = () => {
					if (Array.isArray(segCoords) && segCoords.length >= 2) return segCoords;
					if (this.isGlobe) {
						const segsG = (Array.isArray(canonical.segments_globe) && canonical.segments_globe.length)
							? canonical.segments_globe
							: ((Array.isArray(canonical.coords_globe) && canonical.coords_globe.length) ? [canonical.coords_globe] : []);
						if (!segsG.length) return canonical.coords_globe || baseCoords;
						const len = (arr) => { let s = 0; for (let i = 1; i < arr.length; i++) s += this.distanceKm(arr[i - 1], arr[i]); return s; };
						return segsG.sort((a, b) => len(b) - len(a))[0] || (canonical.coords_globe || baseCoords);
					}
					const segs = (Array.isArray(canonical.segments) && canonical.segments.length)
						? canonical.segments
						: (this.splitLineSegments(baseCoords) || []);
					if (!segs.length) return baseCoords;
					const len = (arr) => { let s = 0; for (let i = 1; i < arr.length; i++) s += this.distanceKm(arr[i - 1], arr[i]); return s; };
					return segs.sort((a, b) => len(b) - len(a))[0] || baseCoords;
				};
				const seg = chooseSeg();
				const xs = seg.map(c => Number(c[0])).filter(isFinite);
				const ys = seg.map(c => Number(c[1])).filter(isFinite);
				// 经度跨 180° 包络修正：若范围 > 180，则将负经度统一加 360 再计算中心
				let minX = Math.min(...xs), maxX = Math.max(...xs);
				let adjXs = xs.slice();
				if (maxX - minX > 180) {
					adjXs = xs.map(v => (v < 0 ? v + 360 : v));
					minX = Math.min(...adjXs);
					maxX = Math.max(...adjXs);
				}
				const minY = Math.min(...ys), maxY = Math.max(...ys);
				let cx = (minX + maxX) / 2;
				if (cx > 180) cx -= 360;
				const cy = (minY + maxY) / 2;
				const spanX = Math.max(1, Math.abs(maxX - minX));
				const spanY = Math.max(1, Math.abs(maxY - minY));
				const span = Math.max(spanX, spanY);
				const zoom = span > 120 ? 1.8 : span > 60 ? 2.2 : span > 20 ? 2.6 : 3.2;
				this.focusTargetCoord = [cx, cy];
				// 移除调试输出
				if (!this.isGlobe) {
					this.geoZoom = zoom;
					this.myChart.setOption({ geo: { center: [cx, cy], zoom: this.geoZoom } });
				}
				this.updateChart();
			} catch (e) { console.warn('聚焦海缆失败', e); }
		},
		focusLanding(lp) {
			try {
				if (!lp || !Array.isArray(lp.coords) || lp.coords.length < 2 || !this.myChart) return;
				// 进入登陆站聚焦时，自动关闭“显示所有故障海缆”
				this.showFaultCablesOnMap = false;
				this.cancelFaultEdit();
				this.focusedCableId = null;
				this.focusMode = 'landing';
				this.focusedFaultLineIds = [];
				this.focusedLanding = lp;
				// 重置并默认全选关联海缆，且显示关联海缆
				this.landingTooltip.selectedCableIds = [];
				this.landingShowAssociated = true;
				// 预取登陆站详情以拿到关联海缆列表
				if (lp && lp.id) {
					this.fetchStationDetail(lp).then(() => {
						const det = this.stationDetails[lp.id];
						const ids = Array.isArray(det?.cables) ? det.cables.map(cb => cb.id || cb.name).filter(Boolean) : [];
						if (ids.length) this.landingTooltip.selectedCableIds = ids;
						this.updateChart();
					}).catch(() => { });
				}
				this.triggerPulse();
				const [cx, cy] = lp.coords;
				this.focusTargetCoord = [Number(cx), Number(cy)];
				if (!this.isGlobe) {
					this.geoZoom = 3.2;
					this.myChart.setOption({ geo: { center: [Number(cx), Number(cy)], zoom: this.geoZoom } });
				}
				this.updateChart();
				this.statesToSlider();
			} catch (e) { console.warn('聚焦登陆站失败', e); }
		},
		focusLandingByRef(lp) {
			if (!lp) return;
			// Try to find coords from landingPoints by id or name
			const match = lp.id ? this.landingPoints.find(p => p.id === lp.id) : null;
			const withCoord = match || lp;
			if (withCoord && Array.isArray(withCoord.coords) && withCoord.coords.length >= 2) {
				this.focusLanding(withCoord);
			}
		},
		focusCableByRef(cb) {
			if (!cb || !cb.id) return;
			const is2Africa = this.normalizeText(cb.name || cb.id || '').toLowerCase().includes('2africa');
			if (is2Africa) {
				const lines = this.filteredCablesMap.filter(l => this.normalizeText(l.name || '').toLowerCase().includes('2africa') || String(l.id || '').includes(cb.id));
				if (lines.length) { this.focusCable(lines[0]); return; }
			}
			const line = this.withMetrics.find(l => l.id === cb.id) || this.cableLines.find(l => l.id === cb.id) || this.filteredCablesMap.find(l => l.id === cb.id);
			if (line) this.focusCable(line);
		},
		clearFocus() {
			this.focusMode = 'none';
			this.focusedCableId = null;
			this.focusedFeatureId = null;
			this.focusedLanding = null;
			this.focusedFaultLineIds = [];
			this.focusTargetCoord = null;
			// 退出聚焦后清理基于登陆站的临时筛选，回到控制台筛选面板的结果
			this.landingTooltip.selectedCableIds = [];
			this.landingShowAssociated = false;
			this.mapTooltipLandingExpandedId = null;
			this.pulseExpiry = 0;
			if (this.myChart) {
				const opt = this.myChart.getOption ? (this.myChart.getOption() || {}) : {};
				const hasGeo = Array.isArray(opt.geo) ? opt.geo.length > 0 : !!opt.geo;
				const hasGlobe = Array.isArray(opt.globe) ? opt.globe.length > 0 : !!opt.globe;
				if (this.isGlobe && hasGlobe) {
					this.globeDistance = 160;
					this.myChart.setOption({ globe: { viewControl: { targetCoord: null, distance: this.globeDistance } } });
				} else if (!this.isGlobe && hasGeo) {
					this.geoZoom = 1.8;
					this.myChart.setOption({ geo: { center: [140, 20], zoom: this.geoZoom } });
				}
			}
			this.updateChart();
		},
		async startFaultEdit(idx) {
			if (!this.selectedFault) return;
			const cableKey = `involvedCable${idx}`;
			const landingKey = `involvedLanding${idx}`;
			const distKey = `distance${idx}`;
			const coordKey = `pointCoord${idx}`;
			this.faultEditState = {
				active: true,
				index: idx,
				cable: this.selectedFault[cableKey] || '',
				landing: this.selectedFault[landingKey] || '',
				distance: this.selectedFault[distKey] || '',
				pointCoord: this.selectedFault[coordKey] || '',
				picking: false,
				pickSession: false,
				saving: false,
				error: ''
			};
			// 进入编辑时默认收起地图工具入口
			this.mapDialOpen = false;
			this.setFaultPointMarkerFromCoord(this.displayCoordFromStr(this.faultEditState.pointCoord));
			try {
				await this.ensureLandingPointsLoaded();
				const cableRaw = this.normalizeText(this.faultEditState.cable || '').toLowerCase();
				if (cableRaw) {
					const candidate = (this.cableLines || []).find(l => {
						const cands = [l.feature_id, l.id, l.name].map(v => this.normalizeText(v || '').toLowerCase());
						return cands.includes(cableRaw);
					});
					if (candidate && candidate.id) {
						await this.ensureCableDetail(candidate.id);
					}
				}
			} catch (e) { /* ignore preload errors */ }
		},
		async onEditCableChange(val) {
			try {
				await this.ensureLandingPointsLoaded();
				const cableRaw = this.normalizeText(val || '').toLowerCase();
				const candidate = (this.cableLines || []).find(l => {
					const cands = [l.feature_id, l.id, l.name].map(v => this.normalizeText(v || '').toLowerCase());
					return cands.includes(cableRaw);
				});
				if (candidate && candidate.id) {
					await this.ensureCableDetail(candidate.id);
				}
				const opts = this.landingOptionsForEdit;
				if (val && this.faultEditState.landing && !opts.includes(this.faultEditState.landing)) {
					this.faultEditState.landing = '';
				}
				this.faultEditState.pointCoord = '';
				this.faultEditState.distance = '';
				this.faultEditState.picking = false;
				this.faultPickHover = null;
				this.faultPickConfirmVisible = false;
				this.faultPickConfirmInfo = null;
				this.clearFaultPointMarker();
			} catch (e) { /* no-op */ }
		},
		cancelFaultEdit() {
			const idx = this.faultEditState.index;
			this.faultEditState = { active: false, index: null, cable: '', landing: '', distance: '', pointCoord: '', picking: false, pickSession: false, saving: false, error: '' };
			this.faultPickHover = null;
			this.faultPickLast = null;
			this.faultPickConfirmVisible = false;
			this.faultPickConfirmInfo = null;
			this.faultPickPath = null;
			if (this.selectedFault && idx) {
				const key = `pointCoord${idx}`;
				this.setFaultPointMarkerFromCoord(this.displayCoordFromStr(this.selectedFault[key] || ''));
			} else {
				this.clearFaultPointMarker();
			}
			this.updateChart();
		},
		onOutsideClickCloseFaultEdit(ev) {
			try {
				if (!this.faultEditState.active) return;
				if (this.faultEditState.picking || this.faultEditState.pickSession || this.faultPickConfirmVisible) return;
				const inSelectDropdown = ev.target.closest('.el-select-dropdown');
				if (inSelectDropdown) return;
				const inside = ev.target.closest('.fault-edit-overlay-inner') || ev.target.closest('.fault-detail');
				if (inside) return;
				this.cancelFaultEdit();
			} catch (e) { /* noop */ }
		},
		async saveFaultEdit() {
			try {
				const wasPicking = !!this.faultEditState.picking;
				const pickSession = !!this.faultEditState.pickSession;
				if (!this.selectedFault) {
					this.faultEditState.error = '未选择故障';
					return;
				}
				const idx = this.faultEditState.index;
				if (![1, 2, 3].includes(idx)) {
					this.faultEditState.error = '无效的编辑项';
					return;
				}
				const cableVal = (this.faultEditState.cable || '').trim();
				const landingVal = (this.faultEditState.landing || '').trim();
				const distVal = (this.faultEditState.distance || '').toString().trim();
				const coordVal = (this.faultEditState.pointCoord || '').toString().trim();
				if (cableVal && !this.cableNameOptions.includes(cableVal)) {
					this.faultEditState.error = '涉及海缆需选择已有海缆';
					return;
				}
				const landingOpts = this.landingOptionsForEdit;
				if (landingVal && !landingOpts.includes(landingVal)) {
					this.faultEditState.error = '登陆站需选择该海缆下的站点';
					return;
				}
				if (distVal && !/^-?\d+(\.\d+)?$/.test(distVal)) {
					this.faultEditState.error = '距离需为数字（单位 km）';
					return;
				}
				const faultId = this.selectedFault.faultId || this.selectedFault.raw?.ctrr_rsrmD_id || '';
				if (!faultId) {
					this.faultEditState.error = '缺少故障ID，无法提交';
					return;
				}
				this.faultEditState.saving = true;
				this.faultEditState.error = '';
				const url = `${this.authBaseUrl()}/customer/editFaultTable`;
				const form = new URLSearchParams();
				form.append('ctrr_rsrmD_id', faultId);
				const cableKey = `涉及海缆${idx}`;
				const landingKey = `故障涉及登陆站${idx}`;
				const distKey = `故障点距离${idx}`;
				const coordKey = `故障点经纬度${idx}`;
				form.append(cableKey, cableVal);
				form.append(landingKey, landingVal);
				form.append(distKey, distVal);
				form.append(coordKey, coordVal);
				const modifier = this.userInfo?.admin_account || this.locationParam.account || '未知';
				form.append('大屏最近一次操作用户', modifier);
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: form,
					credentials: 'include'
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				// 更新本地数据
				const cableProp = `involvedCable${idx}`;
				const landingProp = `involvedLanding${idx}`;
				const distProp = `distance${idx}`;
				const coordProp = `pointCoord${idx}`;
				this.$set(this.selectedFault, cableProp, cableVal);
				this.$set(this.selectedFault, landingProp, landingVal);
				this.$set(this.selectedFault, distProp, distVal);
				this.$set(this.selectedFault, coordProp, coordVal);
				this.$set(this.selectedFault, 'lastModifier', modifier);
				if (this.selectedFault.raw) {
					this.$set(this.selectedFault.raw, '大屏最近一次操作用户', modifier);
				}
				// 同步到 faultsFromApi 列表
				const key = this.faultKey(this.selectedFault);
				this.faultsFromApi = (this.faultsFromApi || []).map(f => (
					this.faultKey(f) === key
						? {
							...f,
							[cableProp]: cableVal,
							[landingProp]: landingVal,
							[distProp]: distVal,
							[coordProp]: coordVal,
							lastModifier: modifier,
							raw: { ...(f.raw || {}), '大屏最近一次操作用户': modifier }
						}
						: f
				));
				// 保存后立即重绘当前聚焦故障，展示最新定位点与走线
				this.updateChart();
				if (pickSession && this.isMapFullscreen) {
					this.isMapFullscreen = false;
					this.$nextTick(() => this.refreshMapAfterLayout());
				}
				this.cancelFaultEdit();
			} catch (e) {
				this.faultEditState.error = `保存失败：${e.message || e}`;
			} finally {
				this.faultEditState.saving = false;
			}
		},
		onGlobalTooltipClick(ev) {
			try {
				if (this.faultEditState.picking) {
					const expand = ev.target.closest('.map-tip [data-action="expand-extra"]');
					if (expand) {
						this.tipExtraCollapsed = false;
						const wrap = expand.closest('.tip-extra');
						if (wrap) {
							const body = wrap.querySelector('.tip-extra-body');
							if (body) body.style.display = '';
							const mask = wrap.querySelector('.tip-extra-mask');
							if (mask) mask.style.display = 'none';
							wrap.classList.remove('collapsed');
						}
						return;
					}
					const extra = ev.target.closest('.tip-extra');
					if (extra) {
						const more = ev.target.closest('.map-tip .more[data-action="expand-chip-list"]');
						if (more) {
							const wrap = more.parentElement ? more.parentElement.querySelector('.chips.scrollable') : null;
							if (wrap) wrap.classList.remove('collapsed');
							const lid = more.getAttribute('data-landing-id');
							if (lid) this.mapTooltipLandingExpandedId = String(lid);
							more.style.display = 'none';
						}
						return;
					}
				}
				// 测距概览无交互；额外信息已加遮罩阻断点击
				// 复选框优先处理，避免被 chip 点击聚焦覆盖
				const ck = ev.target.closest('.map-tip input[data-action="toggle-cable-select"]');
				if (ck) {
					const id = ck.getAttribute('data-id') || ck.getAttribute('data-name');
					if (id) {
						const s = new Set((this.landingTooltip.selectedCableIds || []).map(String));
						if (ck.checked) s.add(String(id));
						else s.delete(String(id));
						this.landingTooltip.selectedCableIds = Array.from(s);
						// 根据当前选择自动显隐：有选择则显示，无选择则隐藏
						this.landingShowAssociated = this.landingTooltip.selectedCableIds.length > 0;
						this.updateChart();
					}
					return;
				}
				const el = ev.target.closest('.map-tip .chip, .tooltip-list .chip');
				if (el) {
					const action = el.getAttribute('data-action');
					const id = el.getAttribute('data-id');
					const name = el.getAttribute('data-name') || '';
					if (action === 'focus-landing') {
						let target = null;
						if (id) target = (this.landingPoints || []).find(p => String(p.id) === String(id));
						if (!target && name) {
							const norm = this.formatLandingName(name).toLowerCase();
							target = (this.landingPoints || []).find(p => this.formatLandingName(p.name).toLowerCase() === norm);
						}
						if (target) this.focusLanding(target);
					} else if (action === 'focus-cable') {
						let target = null;
						if (id) target = (this.withMetrics || []).find(l => String(l.id) === String(id)) || (this.cableLines || []).find(l => String(l.id) === String(id));
						if (!target && name) {
							const norm = name.trim();
							target = (this.withMetrics || []).find(l => (l.name || '').trim() === norm) || (this.cableLines || []).find(l => (l.name || '').trim() === norm);
						}
						if (target) this.focusCable(target);
					}
					return;
				}
				// 登陆站 tooltip 内操作：全选/全不选（同时控制显隐）
				const btnAll = ev.target.closest('.map-tip [data-action="select-all-associated"]');
				if (btnAll) {
					const wrap = btnAll.closest('.map-tip');
					const lid = wrap ? wrap.getAttribute('data-lp-id') : '';
					const lname = wrap ? wrap.getAttribute('data-lp-name') : '';
					const findLanding = () => {
						const norm = v => this.formatLandingName(v || '').toLowerCase();
						if (lid) {
							const byId = (this.landingPoints || []).find(p => String(p.id) === String(lid));
							if (byId) return byId;
						}
						if (lname) {
							const target = norm(lname);
							const byName = (this.landingPoints || []).find(p => norm(p.name) === target || norm(p.id) === target);
							if (byName) return byName;
						}
						return null;
					};
					const baseLp = findLanding() || (this.landingTooltip && this.landingTooltip.lp) || this.focusedLanding || null;
					if (baseLp) {
						try {
							this.landingTooltip.lp = baseLp;
							this.focusLanding(baseLp);
						} catch (e) { /* noop */ }
					}
					return;
				}
				const btnNone = ev.target.closest('.map-tip [data-action="select-none-associated"]');
				if (btnNone) {
					this.landingTooltip.selectedCableIds = [];
					this.landingShowAssociated = false;
					this.updateChart();
					return;
				}
				// 展开“还有 X 条”
				const more = ev.target.closest('.map-tip .more');
				if (more && more.getAttribute('data-action') === 'expand-chip-list') {
					const wrap = more.parentElement ? more.parentElement.querySelector('.chips.scrollable') : null;
					if (wrap) {
						wrap.classList.remove('collapsed');
					}
					const lid = more.getAttribute('data-landing-id');
					if (lid) this.mapTooltipLandingExpandedId = String(lid);
					more.style.display = 'none';
					return;
				}
			} catch (e) { /* noop */ }
		},
		updateChart() {
			if (this._suppressUpdate) return;
			this.ensureChartInstance();
			if (!this.myChart) return;
			// 更新图表
			let lines = [];
			let points = [];
			const picking = !!this.faultEditState.picking;
			const pickingLine = picking ? this.findCableByEditName(this.faultEditState.cable || '') : null;
			// 当开启“显示故障海缆”时，即便关闭常规海缆，也要确保故障走线能画出来
			const showCablesFlag = this.showCables || picking || this.showFaultCablesOnMap;
			const showLandingsFlag = this.showLandings || picking;
			const pickLandingName = this.normalizeText(this.faultEditState.landing || '').toLowerCase();
			const focusFaultSet = (this.focusMode === 'fault' && Array.isArray(this.focusedFaultLineIds) && this.focusedFaultLineIds.length)
				? new Set(this.focusedFaultLineIds.map(v => String(v || '').trim().toLowerCase()).filter(Boolean))
				: null;
			let faultLines = (this.showFaultCablesOnMap && showCablesFlag && !picking) ? this.buildFaultLines({ highlightSet: focusFaultSet }) : [];
			let pulseCable = false;
			let pulseLanding = false;
			let titleText = '全球海缆运行状态总览';
			let targetCoord = this.focusTargetCoord;
			if (picking) {
				// 故障打点模式：仅沿涉及海缆打点
				const editLine = pickingLine;
				const decor = editLine ? this.decorateLines([editLine]) : [];
				lines = decor.map(item => ({
					...item,
					lineStyle: { ...(item.lineStyle || {}), color: '#ff4d4f', type: 'dashed', width: 2.4, opacity: 1 },
					effect: { ...(item.effect || {}), show: false }
				}));
				points = editLine ? (this.buildLandingPointsForLine(editLine) || []) : [];
				pulseLanding = true;
				titleText = `故障打点模式  ｜  仅沿涉及海缆走线打点  ｜  当前海缆：${this.faultEditState.cable || '未选择'}  ｜  起点登陆站：${this.faultEditState.landing || '未选择'}`;
				faultLines = [];
				if (editLine && Array.isArray(editLine.coords) && editLine.coords.length) {
					const xs = editLine.coords.map(c => Number(c[0])).filter(isFinite);
					const ys = editLine.coords.map(c => Number(c[1])).filter(isFinite);
					if (xs.length && ys.length) {
						const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
						const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
						targetCoord = [cx, cy];
						this.focusTargetCoord = targetCoord;
					}
				}
			} else if (this.focusMode === 'fault') {
				const fault = this.selectedFault;
				const hasCoords = fault ? [1, 2, 3].some(idx => this.parseCoordStr(fault[`pointCoord${idx}`] || '')) : false;
				const hasCables = fault ? [1, 2, 3].some(idx => this.normalizeText(fault[`involvedCable${idx}`] || '')) : false;
				const hasLandings = fault ? [1, 2, 3].some(idx => this.normalizeText(fault[`involvedLanding${idx}`] || '')) : false;
				const resolvedLines = fault ? this.resolveFaultLines(fault) : [];
				const focusLineSet = (focusFaultSet && focusFaultSet.size)
					? focusFaultSet
					: (resolvedLines.length ? new Set(resolvedLines.map(l => this.normalizeText(l.feature_id || l.id || l.name))) : null);
				if (!hasCoords && !hasCables && !hasLandings) {
					// 无任何可绘制数据：仍进入聚焦，但清空并回到亚太中心
					lines = [];
					points = [];
					faultLines = [];
					pulseCable = false;
					pulseLanding = false;
					titleText = fault ? (this.faultTitle(fault) || '故障') : '故障';
					const fallbackCoord = [120, 20];
					targetCoord = fallbackCoord;
					this.focusTargetCoord = fallbackCoord;
					if (this.isGlobe && this.myChart) {
						try { this.myChart.setOption({ globe: { viewControl: { targetCoord: fallbackCoord } } }, false); } catch (e) { /* noop */ }
					} else if (this.myChart) {
						try { this.myChart.setOption({ geo: { center: fallbackCoord, zoom: this.geoZoom || 1.8 } }, false); } catch (e) { /* noop */ }
					}
				} else if (focusLineSet && focusLineSet.size) {
					const focusLines = this.buildFaultLines({ filterSet: focusLineSet, highlightSet: focusLineSet });
					lines = focusLines;
					// 故障聚焦：只绘制筛选后的故障线
					const landingPts = [];
					focusLines.forEach(item => {
						if (!item || !item.lineData) return;
						const pts = this.buildLandingPointsForLine(item.lineData) || [];
						if (pts.length) landingPts.push(...pts);
					});
					const faultLocPts = this.buildFaultLocationPoints(this.selectedFault);
					if (faultLocPts.length) landingPts.push(...faultLocPts);
					points = landingPts;
					pulseCable = true;
					titleText = this.selectedFault ? this.faultTitle(this.selectedFault) : '故障';
					const coords = [];
					focusLines.forEach(item => { if (Array.isArray(item?.coords)) coords.push(...item.coords); });
					if (coords.length) {
						const xs = coords.map(c => Number(c[0])).filter(isFinite);
						const ys = coords.map(c => Number(c[1])).filter(isFinite);
						if (xs.length && ys.length) {
							let minX = Math.min(...xs), maxX = Math.max(...xs);
							let adjXs = xs.slice();
							if (maxX - minX > 180) {
								adjXs = xs.map(v => (v < 0 ? v + 360 : v));
								minX = Math.min(...adjXs);
								maxX = Math.max(...adjXs);
							}
							const minY = Math.min(...ys), maxY = Math.max(...ys);
							let cx = (minX + maxX) / 2;
							if (cx > 180) cx -= 360;
							const cy = (minY + maxY) / 2;
							targetCoord = [cx, cy];
							this.focusTargetCoord = targetCoord;
							const spanX = Math.max(1, Math.abs(maxX - minX));
							const spanY = Math.max(1, Math.abs(maxY - minY));
							const span = Math.max(spanX, spanY);
							const zoom = span > 120 ? 1.8 : span > 60 ? 2.2 : span > 20 ? 2.6 : 3.2;
							if (!this.isGlobe) {
								this.geoZoom = zoom;
								this.myChart.setOption({ geo: { center: [cx, cy], zoom: this.geoZoom } });
							}
						}
					}
				} else {
					// 有定位点或涉及登陆站但未匹配到走线时，仍展示故障定位点并聚焦
					const faultLocPts = fault ? this.buildFaultLocationPoints(fault) : [];
					lines = [];
					faultLines = [];
					points = faultLocPts;
					pulseCable = false;
					pulseLanding = true;
					titleText = fault ? (this.faultTitle(fault) || '故障') : '故障';
					if (faultLocPts.length) {
						const xs = faultLocPts.map(p => Number((p && p.value && p.value[0]) || 0)).filter(isFinite);
						const ys = faultLocPts.map(p => Number((p && p.value && p.value[1]) || 0)).filter(isFinite);
						if (xs.length && ys.length) {
							const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
							const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
							targetCoord = [cx, cy];
							this.focusTargetCoord = targetCoord;
							if (!this.isGlobe && this.myChart) {
								this.geoZoom = 2.8;
								this.myChart.setOption({ geo: { center: [cx, cy], zoom: this.geoZoom } }, false);
							} else if (this.isGlobe && this.myChart) {
								this.myChart.setOption({ globe: { viewControl: { targetCoord } } }, false);
							}
						}
					}
				}
			} else if (this.focusMode === 'cable' && this.focusedCableId) {
				// 海缆聚焦
				const is2Africa = this.normalizeText(this.focusedFeatureId || this.focusedCableId || '').toLowerCase().includes('2africa');
				// 先按 feature_id 精确匹配，再退回 id；2Africa 额外聚合同名多分段
				const baseLine = (() => {
					if (is2Africa) {
						return this.filteredCablesMap.find(l => this.normalizeText(l.name || '').toLowerCase().includes('2africa'))
							|| this.withMetrics.find(l => this.normalizeText(l.name || '').toLowerCase().includes('2africa'))
							|| null;
					}
					return (this.focusedFeatureId
						? (this.filteredCablesMap.find(l => l.feature_id === this.focusedFeatureId) || this.withMetrics.find(l => l.feature_id === this.focusedFeatureId))
						: null) || (this.filteredCablesMap.find(l => l.id === this.focusedCableId) || this.withMetrics.find(l => l.id === this.focusedCableId));
				})();
				if (baseLine) {
					const siblings = is2Africa
						? this.filteredCablesMap.filter(l => this.normalizeText(l.name || '').toLowerCase().includes('2africa') || l.id === baseLine.id)
						: this.filteredCablesMap.filter(l => l.id === baseLine.id);
					const drawLines = siblings.length ? siblings : [baseLine];
					lines = this.decorateLines(drawLines);
					// 聚合同一海缆ID的所有分段登陆站，避免仅显示其中一个分段
					let allPts = [];
					drawLines.forEach(dl => {
						const pts = this.buildLandingPointsForLine(dl) || [];
						if (pts && pts.length) allPts.push(...pts);
					});
					// 去重（优先按登陆站ID，其次按坐标）
					const seen = new Set();
					allPts = allPts.filter(p => {
						const key = (p.lpData && p.lpData.id)
							? `id:${p.lpData.id}`
							: (Array.isArray(p.value) && p.value.length >= 2)
								? `coord:${Number(p.value[0]).toFixed(6)},${Number(p.value[1]).toFixed(6)}`
								: Math.random().toString(36).slice(2);
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});
					// 兜底：若所有分段均未匹配到登陆站，至少展示每段的起终点
					if (!allPts.length) {
						drawLines.forEach(dl => {
							if (!Array.isArray(dl.coords)) return;
							const color = this.ownershipColor(dl.ownership || '非权益');
							const ends = [dl.coords[0], dl.coords[dl.coords.length - 1]];
							ends.forEach((coord, idx) => {
								if (!Array.isArray(coord) || coord.length < 2) return;
								allPts.push({ name: this.normalizeText(idx === 0 ? `${dl.name}-起点` : `${dl.name}-终点`), value: coord, lineData: dl, itemStyle: { color } });
							});
						});
					}
					points = allPts;
					pulseCable = true;
					titleText = this.displayCableName(baseLine) || '海缆';
					// 计算聚焦中心：优先用装饰后的最长分段，其次用原始几何（2D/3D按模式）
					const segLen = (arr) => {
						if (!Array.isArray(arr) || arr.length < 2) return 0;
						let s = 0; for (let i = 1; i < arr.length; i++) s += this.distanceKm(arr[i - 1], arr[i]); return s;
					};
					let seg = null;
					if (Array.isArray(lines) && lines.length) {
						const longestItem = lines.slice().sort((a, b) => segLen(b.coords) - segLen(a.coords))[0];
						seg = (longestItem && longestItem.coords) ? longestItem.coords : null;
					}
					if (!seg || !seg.length) {
						if (this.isGlobe) {
							if (Array.isArray(baseLine.segments_globe) && baseLine.segments_globe.length) {
								seg = baseLine.segments_globe.slice().sort((a, b) => segLen(b) - segLen(a))[0];
							} else {
								seg = baseLine.coords_globe || baseLine.coords || null;
							}
						} else {
							if (Array.isArray(baseLine.segments) && baseLine.segments.length) {
								seg = baseLine.segments.slice().sort((a, b) => segLen(b) - segLen(a))[0];
							} else {
								seg = baseLine.coords || null;
							}
						}
					}
					if (Array.isArray(seg) && seg.length) {
						const xs = seg.map(c => Number(c[0])).filter(isFinite);
						const ys = seg.map(c => Number(c[1])).filter(isFinite);
						if (xs.length && ys.length) {
							let minX = Math.min(...xs), maxX = Math.max(...xs);
							let adjXs = xs.slice();
							if (maxX - minX > 180) {
								adjXs = xs.map(v => (v < 0 ? v + 360 : v));
								minX = Math.min(...adjXs);
								maxX = Math.max(...adjXs);
							}
							const minY = Math.min(...ys), maxY = Math.max(...ys);
							let cx = (minX + maxX) / 2;
							if (cx > 180) cx -= 360;
							const cy = (minY + maxY) / 2;
							targetCoord = [cx, cy];
							this.focusTargetCoord = targetCoord;
						}
					}
				}
			} else if (this.focusMode === 'landing' && this.focusedLanding && Array.isArray(this.focusedLanding.coords)) {
				// 展示登陆站，并根据选择显示关联海缆
				const det = this.stationDetails[this.focusedLanding.id] || {};
				const allCables = Array.isArray(det.cables) ? det.cables : [];
				const selectedSet = (() => {
					if (this.landingTooltip && Array.isArray(this.landingTooltip.selectedCableIds) && this.landingTooltip.selectedCableIds.length) {
						return new Set(this.landingTooltip.selectedCableIds.map(v => String(v || '').trim().toLowerCase()));
					}
					return new Set(allCables.map(cb => String(cb.id || cb.feature_id || cb.name)).filter(Boolean).map(v => v.trim().toLowerCase()));
				})();
				const candidateLines = this.filteredCablesMap.filter(l => {
					const keys = [l.id, l.name, l.feature_id].map(v => String(v || '').trim().toLowerCase());
					return keys.some(k => k && selectedSet.has(k));
				});
				lines = this.landingShowAssociated ? this.decorateLines(candidateLines) : [];
				const color = this.ownershipColor(this.focusedLanding.ownership || '非权益');
				points = [{ name: this.normalizeText(this.focusedLanding.name || '登陆站'), value: this.focusedLanding.coords, lpData: this.focusedLanding, detail: this.stationDetails[this.focusedLanding.id] || null, itemStyle: { color } }];
				pulseLanding = true;
				titleText = this.displayLandingName(this.focusedLanding) || '登陆站';
				targetCoord = this.focusedLanding.coords;
				this.focusTargetCoord = targetCoord;
			} else {
				// 若登陆站关联海缆有选择，则按选择过滤（支持 id/name/feature_id）；否则展示全量
				const visSet = (this.landingTooltip && Array.isArray(this.landingTooltip.selectedCableIds) && this.landingTooltip.selectedCableIds.length)
					? new Set(this.landingTooltip.selectedCableIds.map(v => String(v || '').trim().toLowerCase()))
					: null;
				const baseLines = visSet
					? this.filteredCablesMap.filter(l => {
						const keys = [l.id, l.name, l.feature_id].map(v => String(v || '').trim().toLowerCase());
						return keys.some(k => k && visSet.has(k));
					})
					: this.filteredCablesMap;
				lines = this.decorateLines(baseLines);
				points = this.buildLandingPointsForMap(this.filteredCablesMap);
				const locPts = this.selectedFault ? this.buildFaultLocationPoints(this.selectedFault) : this.buildAllFaultLocationPoints();
				if (locPts.length) points = points.concat(locPts);
				targetCoord = null;
				this.focusTargetCoord = null;
			}
			if (showCablesFlag) {
				// 若是故障聚焦且仅单条（例如通过地图点击某条故障海缆进入聚焦），则不叠加其余故障
				const isSingleFaultFocus = (this.focusMode === 'fault' && focusFaultSet && focusFaultSet.size === 1);
				if (this.focusMode === 'fault' && focusFaultSet && focusFaultSet.size > 1) {
					const norm = (v) => String(v || '').trim().toLowerCase();
					const existing = new Set(lines.map(it => norm(it?.lineData?.feature_id || it?.lineData?.id || it?.name)));
					const restFault = faultLines.filter(it => {
						const key = norm(it?.lineData?.feature_id || it?.lineData?.id || it?.name);
						if (!key) return true;
						if (existing.has(key)) return false;
						existing.add(key);
						return true;
					});
					lines = lines.concat(restFault);
				} else if (!isSingleFaultFocus) {
					// 非故障聚焦或非单条故障聚焦时，正常叠加所有故障
					lines = lines.concat(faultLines);
				}
			} else {
				lines = [];
			}
			if (!showLandingsFlag) points = [];
			const hasFaultPoints = (Array.isArray(points) ? points : []).some(p => p && p.isFaultLocation);
			const faultOverlayActive = (!picking && showCablesFlag && this.showFaultCablesOnMap && (faultLines.length > 0 || hasFaultPoints) && !(this.focusMode === 'fault' && focusFaultSet && focusFaultSet.size));
			// 叠加状态不再输出调试
			if (faultOverlayActive) {
				const dimLineOpacity = 0.18;
				lines = lines.map(item => {
					if (!item || item.fault) return item;
					const lineStyle = { ...(item.lineStyle || {}), opacity: dimLineOpacity };
					const emphasis = item.emphasis ? { ...item.emphasis, lineStyle: { ...(item.emphasis.lineStyle || {}), opacity: 1 } } : undefined;
					let effect = item.effect;
					if (Array.isArray(effect)) {
						effect = effect.map(e => ({ ...(e || {}), opacity: dimLineOpacity }));
					} else if (effect && typeof effect === 'object') {
						effect = { ...effect, opacity: dimLineOpacity };
					}
					return { ...item, lineStyle, emphasis, effect };
				});
				// 同步降低非故障点透明度（含 3D），故障点保持原样
				points = points.map(p => {
					if (!p || p.isFaultLocation) return p;
					const baseOpacity = (p.itemStyle && p.itemStyle.opacity != null) ? p.itemStyle.opacity : 1;
					const dimPointOpacity = Math.min(0.45, baseOpacity * 0.45);
					return { ...p, itemStyle: { ...(p.itemStyle || {}), opacity: dimPointOpacity } };
				});
			}
			// 地球模式：直接使用 3D 配置并返回
			const prevOpt = this.myChart.getOption ? (this.myChart.getOption() || {}) : {};
			const hasGeo = Array.isArray(prevOpt.geo) ? prevOpt.geo.length > 0 : !!prevOpt.geo;
			const hasGlobe = Array.isArray(prevOpt.globe) ? prevOpt.globe.length > 0 : !!prevOpt.globe;
			// 3D 模式补充：把“故障定位点（pointCoordX）”与当前打点 marker 注入到 points，确保在地球上显示
			if (this.isGlobe) {
				const showFaultPoints = this.showFaultCablesOnMap || this.focusMode === 'fault' || picking;
				if (showFaultPoints) {
					const faultsList = (this.focusMode === 'fault' && this.selectedFault)
						? [this.selectedFault]
						: ((Array.isArray(this.displayFaults) && this.displayFaults.length) ? this.displayFaults : []);
					faultsList.forEach((f, fi) => {
						for (let i = 1; i <= 3; i++) {
							const coord = this.displayCoordFromStr(f[`pointCoord${i}`]);
							if (coord && coord.length >= 2 && isFinite(coord[0]) && isFinite(coord[1])) {
								points.push({
									value: [Number(coord[0]), Number(coord[1])],
									name: `${this.faultTitle(f) || '故障'}-${i}`,
									labelName: `故障 ${fi + 1} 定位点 ${i}`,
									isFaultLocation: true,
									itemStyle: { color: '#ff4d4f', opacity: 0.85 },
									symbolSize: 12
								});
							}
						}
					});
					// 当前打点会话的脉冲点也加入 3D（diamond 样式），用于确认定位
					const faultPointCoord = this.getFaultPointMarkerCoord();
					const hasIndex = this.faultEditState && [1, 2, 3].includes(this.faultEditState.index);
					const currentFaultLabel = hasIndex ? `故障定位点 ${this.faultEditState.index}` : '故障定位点';
					if (faultPointCoord && Array.isArray(faultPointCoord)) {
						points.push({
							value: faultPointCoord,
							name: '故障定位点',
							labelName: currentFaultLabel,
							isFaultLocation: true,
							itemStyle: { color: '#ff4d4f', opacity: 0.7 },
							symbolSize: 12
						});
					}
				}
			}
			if (this.isGlobe) {
				const prevTarget = (() => {
					try {
						if (hasGlobe && prevOpt.globe) {
							const g = Array.isArray(prevOpt.globe) ? prevOpt.globe[0] : prevOpt.globe;
							return g && g.viewControl && Array.isArray(g.viewControl.targetCoord) ? g.viewControl.targetCoord : null;
						}
					} catch (e) { }
					return null;
				})();
				const prevViewControl = (() => {
					try {
						if (hasGlobe && prevOpt.globe) {
							const g = Array.isArray(prevOpt.globe) ? prevOpt.globe[0] : prevOpt.globe;
							return g && g.viewControl ? g.viewControl : null;
						}
					} catch (e) { }
					return null;
				})();
				const globeOpt = this.makeOptionGlobe(lines, points, titleText, targetCoord || prevTarget, prevViewControl);
				this.myChart.setOption(globeOpt, true);
				this.onResize();
				return;
			}
			// 2D 模式：始终全量覆盖，避免多国配色 regions 残留
			this.myChart.setOption(this.makeOption(lines, points), true);
			const ownershipLineZ = { '非权益': 40, '租用': 50, '合建': 60, '自建': 70, '故障': 90 };
			const ownershipPointZ = { '非权益': 50, '租用': 60, '合建': 70, '自建': 80, '故障': 110 };

			const normalizeOwnership = (label) => {
				if (!label || label === '其他') return '非权益';
				return label;
			};

			// 按权益分组海缆走线，分别赋予 zlevel
			const groupLines = {};
			lines.forEach(item => {
				const label = item?.fault ? '故障' : normalizeOwnership((item?.lineData?.ownership) || '非权益');
				const key = label || '非权益';
				if (!groupLines[key]) groupLines[key] = [];
				groupLines[key].push(item);
			});
			let lineSeriesList = Object.keys(groupLines).map(label => ({
				id: `cables-${label}`,
				name: `海缆（${label}）`,
				type: 'lines',
				coordinateSystem: 'geo',
				zlevel: ownershipLineZ[label] ?? ownershipLineZ['非权益'],
				polyline: true,
						effect: { show: this.lineEffectEnabled || this.focusMode === 'cable' || this.focusMode === 'fault', constantSpeed: 80, symbol: 'circle', symbolSize: 6, trailLength: 0.06, color: '#c8f7ff' },
				animation: false,
				lineStyle: { width: 3, opacity: 0.3, curveness: 0.15, color: (label === '故障' ? '#ff4d4f' : this.ownershipColor(label)) },
				itemStyle: { color: (label === '故障' ? '#ff4d4f' : this.ownershipColor(label)) },
				emphasis: { lineStyle: { opacity: 1, width: 5 } },
				data: groupLines[label]
			}));
			// 保证图例包含“海缆（非权益）”，即使当前数据为空
			if (!groupLines['非权益']) {
				lineSeriesList.push({
					id: 'cables-非权益',
					name: '海缆（非权益）',
					type: 'lines', coordinateSystem: 'geo', zlevel: ownershipLineZ['非权益'] ?? 50, polyline: true,
					animation: false,
					lineStyle: { width: 3, opacity: 0.0, curveness: 0.15, color: this.ownershipColor('非权益') },
					itemStyle: { color: this.ownershipColor('非权益') },
					emphasis: { lineStyle: { opacity: 1, width: 5 } },
					data: []
				});
			}

			// 按权益分组登陆站，分别赋予 zlevel
			if (picking) {
				const norm = (v) => this.normalizeText(v || '').toLowerCase();
				const matchLanding = (p) => {
					if (!pickLandingName) return false;
					const lp = p?.lpData || {};
					const nm = norm(lp.name || p.name || '');
					return nm === pickLandingName;
				};
				let filtered = Array.isArray(points) ? points.filter(matchLanding) : [];
				if (!filtered.length && pickLandingName && Array.isArray(this.landingPoints)) {
					const lp = this.landingPoints.find(x => norm(x.name) === pickLandingName || norm(this.formatLandingName(x.name)) === pickLandingName || norm(x.id) === pickLandingName);
					if (lp && Array.isArray(lp.coords)) {
						filtered.push({ name: this.displayLandingName(lp) || lp.name, value: lp.coords, lpData: lp, detail: this.stationDetails?.[lp.id] || null });
					}
				}
				filtered = filtered.map(p => ({ ...p, itemStyle: { ...(p.itemStyle || {}), color: '#ff9900', opacity: 1 } }));
				points = filtered;
				pulseLanding = filtered.length > 0;
			}
			const faultLocPoints = picking ? [] : points.filter(p => p && p.isFaultLocation);
			let basePoints = points.filter(p => !(p && p.isFaultLocation));
			if (faultOverlayActive) {
				const dimPointOpacity = 0.45;
				basePoints = basePoints.map(p => ({ ...p, itemStyle: { ...(p.itemStyle || {}), opacity: dimPointOpacity } }));
			}
			const pinSymbol = 'path://M0,-22 C-10,-22 -18,-14 -18,-4 C-18,8 -7,6 0,20 C7,6 18,8 18,-4 C18,-14 10,-22 0,-22 Z';
			const faultPointCoord = this.getFaultPointMarkerCoord();
			const hasIndex = this.faultEditState && [1, 2, 3].includes(this.faultEditState.index);
			const currentFaultLabel = hasIndex ? `故障定位点 ${this.faultEditState.index}` : '故障定位点';
			const groupPoints = {};
			basePoints.forEach(item => {
				const label = normalizeOwnership((item?.lpData?.ownership) || '非权益');
				const key = label || '非权益';
				if (!groupPoints[key]) groupPoints[key] = [];
				groupPoints[key].push(item);
			});
			const pointsSeriesList = Object.keys(groupPoints).map(label => ({
				id: `points-${label}`,
				name: `登陆站（${label}）`,
				type: pulseLanding ? 'effectScatter' : 'scatter',
				coordinateSystem: 'geo',
				zlevel: ownershipPointZ[label] ?? ownershipPointZ['非权益'],
				label: {
					show: (this.focusMode !== 'none') || this.showLandingLabels,
					formatter: p => {
						const d = p && p.data;
						const lp = d && (d.lpData || null);
						if (lp) return this.displayLandingName(lp);
						const name = d && (d.name || '');
						return this.normalizeText(name);
					},
					color: '#fff',
					fontSize: 14,
					backgroundColor: 'rgba(0,0,0,0.35)',
					padding: [4, 6],
					borderRadius: 4,
					distance: 12,
					position: 'right',
					offset: [8, 0]
				},
				// 基础尺寸按权益：非权益12、租用14、合建16、自建18
				// 登陆聚焦模式整体 +4；悬停时再 +2
				symbolSize: (() => {
					const base = this.ownershipLandingSize(label);
					const bump = (this.focusMode === 'landing') ? 4 : 0;
					return base + bump;
				})(),
				rippleEffect: pulseLanding ? { scale: 4.5, brushType: 'stroke', period: 3.2 } : undefined,
				animation: false,
				itemStyle: { opacity: 0.65, color: this.ownershipColor(label) },
				emphasis: {
					scale: true,
					itemStyle: { opacity: 1, shadowBlur: 18, shadowColor: 'rgba(200, 247, 255, 0.95)' },
					animation: true,
					animationDuration: 220,
					animationEasing: 'elasticOut',
					symbolSize: (() => {
						const base = this.ownershipLandingSize(label);
						const bump = (this.focusMode === 'landing') ? 4 : 0;
						return base + bump + 2;
					})()
				},
				data: groupPoints[label]
			}));
			let faultLocSeries = [{
				// 故障定位点（2D）：红色菱形，默认显示标签。仅显示故障点，不包含“涉及登陆站”。
				id: 'fault-locations',
				name: '故障定位点与涉及登陆站',
				type: 'effectScatter',
				coordinateSystem: 'geo',
				zlevel: 95,
				symbol: 'diamond',
				symbolSize: (val, params) => {
					const d = params && params.data ? params.data : {};
					return d.symbolSize || 12;
				},
				rippleEffect: { scale: 2.6, brushType: 'stroke', period: 2.6 },
				label: {
					show: true,
					formatter: params => {
						const d = params && params.data ? params.data : {};
						const name = this.displayLandingName(d.lpData || {}) || d.name || '';
						return d.distance ? `${name} ${d.distance}` : name;
					},
					color: '#ff4d4f',
					fontWeight: 'bold',
					backgroundColor: 'rgba(0,0,0,0.45)',
					padding: [4, 6],
					borderRadius: 4
				},
				itemStyle: { color: '#ff4d4f', opacity: 0.95 },
				data: faultLocPoints
			}];
			if (!this.showFaultCablesOnMap && this.focusMode !== 'fault' && !picking) {
				faultLocSeries = [];
			}
			// 故障涉及登陆站（2D）：橙色涟漪效果。应用户要求，在 2D 模式下隐藏该图层，仅在 3D 模式展示。
			const involvedLandingPoints = (() => {
				const src = (Array.isArray(this.faultsFromApi) && this.faultsFromApi.length) ? this.faultsFromApi : (this.displayFaults || []);
				const out = [];
				const norm = v => this.normalizeText(v || '').toLowerCase();
				(src || []).forEach(f => {
					for (let idx = 1; idx <= 3; idx++) {
						const nameRaw = f[`involvedLanding${idx}`] || '';
						const dist = f[`distance${idx}`] || '';
						if (!nameRaw) continue;
						const match = (this.landingPoints || []).find(lp => {
							const names = [lp.name, this.formatLandingName(lp.name), lp.id].map(x => norm(x));
							const target = norm(nameRaw);
							return names.includes(target);
						});
						if (match && Array.isArray(match.coords)) {
							out.push({ name: this.displayLandingName(match), value: match.coords, lpData: match, distance: dist });
						}
					}
				});
				return out;
			})();
			const faultInvolvedLandingSeries = {
				id: 'fault-involved-landings',
				name: '故障涉及登陆站',
				type: 'effectScatter',
				coordinateSystem: 'geo',
				zlevel: 96,
				label: {
					show: true,
					formatter: p => {
						const d = p && p.data;
						const lp = d && (d.lpData || null);
						const name = lp ? this.displayLandingName(lp) : (d?.name || '');
						return d?.distance ? `${name} ${d.distance}` : name;
					},
					color: '#ff9900',
					backgroundColor: 'rgba(0,0,0,0.35)',
					padding: [4, 6],
					borderRadius: 4,
					position: 'right',
					distance: 12,
					offset: [8, 0]
				},
				symbol: 'circle',
				symbolSize: 12,
				itemStyle: { color: '#ff9900', opacity: 0.95 },
				showEffectOn: 'render',
				rippleEffect: { scale: 3.6, brushType: 'stroke', period: 3.2 },
				data: involvedLandingPoints
			};
			// 海缆名称标签（聚焦海缆时显示）
			const cableLabelSeries = (() => {
				if (!(this.focusMode === 'cable' && this.focusedFeatureId && this.showCableLabels)) return null;
				const lineObj = this.cableLines.find(l => l.feature_id === this.focusedFeatureId) || this.filteredCablesMap.find(l => l.feature_id === this.focusedFeatureId) || null;
				const coords = Array.isArray(lineObj?.coords) ? lineObj.coords : [];
				if (!coords.length) return null;
				const segments = this.splitLineSegments(coords);
				const lenSeg = (arr) => { let s = 0; for (let i = 1; i < arr.length; i++) s += this.distanceKm(arr[i - 1], arr[i]); return s; };
				const seg = segments.length ? segments.sort((a, b) => lenSeg(b) - lenSeg(a))[0] : coords;
				const midIdx = Math.floor((seg.length - 1) / 2);
				const mid = seg[midIdx] || seg[0];
				const name = this.displayCableName(lineObj) || '海缆';
				return {
					id: 'cable-label', type: 'scatter', coordinateSystem: 'geo', zlevel: 8, symbolSize: 22, animation: false,
					label: {
						show: true,
						formatter: () => name,
						color: '#fff', fontSize: 22, fontWeight: 'bolder',
						backgroundColor: 'rgba(0,0,0,0.7)', padding: [8, 12], borderRadius: 8,
						position: 'right', distance: 18,
						shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.6)',
						textBorderColor: '#000', textBorderWidth: 3
					},
					itemStyle: { color: 'rgba(0,0,0,0)', opacity: 0 },
					data: [{ value: mid }]
				};
			})();
			const nodesSeries = {
				id: 'path-nodes',
				type: 'scatter',
				coordinateSystem: 'geo',
				zlevel: 4,
				symbol: 'circle',
				symbolSize: picking ? 7 : 0,
				label: { show: false },
				itemStyle: picking ? { color: '#7cd7ff', opacity: 0.95 } : { color: 'transparent', borderColor: 'transparent', borderWidth: 0 },
				animation: false,
				data: (picking && pickingLine && Array.isArray(pickingLine.coords)) ? pickingLine.coords.map(c => ({ value: c })) : []
			};
			const faultPointSeries = null;
			const showFaultPoints = this.showFaultCablesOnMap || this.focusMode === 'fault' || picking;
			const faultPointPulseSeries = (faultPointCoord && hasIndex && showFaultPoints) ? {
				id: 'fault-point-pulse',
				name: '故障定位点与涉及登陆站',
				type: this.isGlobe ? 'scatter3D' : 'effectScatter',
				coordinateSystem: this.isGlobe ? 'globe' : 'geo',
				zlevel: 179,
				symbol: 'diamond',
				symbolSize: 12,
				itemStyle: { color: '#ff4d4f', opacity: 0.9, shadowBlur: 12, shadowColor: 'rgba(255,77,79,0.5)' },
				rippleEffect: this.isGlobe ? undefined : { scale: 3.0, brushType: 'stroke', period: 2.6 },
				label: {
					show: true,
					formatter: p => (p?.data?.labelName) || currentFaultLabel,
					color: '#ff4d4f',
					fontWeight: 'bold',
					backgroundColor: 'rgba(40,24,4,0.72)',
					padding: [4, 6],
					borderRadius: 6,
					position: 'top',
					offset: [0, -8]
				},
				animation: false,
				data: [{ value: faultPointCoord, name: '故障定位点', labelName: currentFaultLabel }]
			} : null;
			const faultPointAll = [];
			const sourceFaultsRaw = Array.isArray(this.faultsFromApi) && this.faultsFromApi.length ? this.faultsFromApi : (this.displayFaults || []);
			const collectKey = (v, set) => {
				const norm = this.normalizeText(v || '').toLowerCase();
				const raw = String(v || '').trim().toLowerCase();
				if (norm) set.add(norm);
				if (raw && raw !== norm) set.add(raw);
			};
			const pickCableKeys = new Set();
			collectKey(this.faultEditState.cable, pickCableKeys);
			if (pickingLine) {
				collectKey(pickingLine.id, pickCableKeys);
				collectKey(pickingLine.name, pickCableKeys);
				collectKey(pickingLine.feature_id, pickCableKeys);
			}
			if (this.faultPickHover && this.faultPickHover.lineId) collectKey(this.faultPickHover.lineId, pickCableKeys);
			const focusCableLine = (() => {
				if (this.focusMode !== 'cable') return null;
				return this.withMetrics.find(l => l.id === this.focusedCableId) || this.cableLines.find(l => l.id === this.focusedCableId) || null;
			})();
			const focusCableKeys = new Set();
			if (focusCableLine) {
				collectKey(focusCableLine.id, focusCableKeys);
				collectKey(focusCableLine.name, focusCableKeys);
				collectKey(focusCableLine.feature_id, focusCableKeys);
			}
			const faultKeys = (f) => {
				const keys = [];
				for (let i = 1; i <= 3; i++) {
					const norm = this.normalizeText(f[`involvedCable${i}`] || '').toLowerCase();
					const raw = String(f[`involvedCable${i}`] || '').trim().toLowerCase();
					if (norm) keys.push(norm);
					if (raw && raw !== norm) keys.push(raw);
				}
				return keys;
			};
			const matchPick = (f) => {
				if (!pickCableKeys.size) return false;
				return faultKeys(f).some(k => pickCableKeys.has(k));
			};
			const matchFocus = (f) => {
				if (!focusCableKeys.size) return true;
				return faultKeys(f).some(k => focusCableKeys.has(k));
			};
			const matchEntryCable = (val) => {
				const keys = new Set();
				collectKey(val, keys);
				if (picking) {
					if (!pickCableKeys.size) return false;
					return Array.from(keys).some(k => pickCableKeys.has(k));
				}
				if (focusCableKeys.size) return Array.from(keys).some(k => focusCableKeys.has(k));
				return true;
			};
			const sourceFaults = (() => {
				if (this.focusMode === 'fault' && this.selectedFault) return [this.selectedFault];
				if (picking) return sourceFaultsRaw.filter(matchPick);
				if (!picking && focusCableKeys.size) return sourceFaultsRaw.filter(matchFocus);
				return sourceFaultsRaw;
			})();
			const matchCable = (f) => (picking ? matchPick(f) : (!picking && focusCableKeys.size ? matchFocus(f) : true));
			sourceFaults.forEach((f, fi) => {
				if (!matchCable(f)) return;
				for (let i = 1; i <= 3; i++) {
					if (!matchEntryCable(f[`involvedCable${i}`])) continue;
					const coord = this.displayCoordFromStr(f[`pointCoord${i}`]);
					if (coord && coord.length >= 2 && isFinite(coord[0]) && isFinite(coord[1])) {
						faultPointAll.push({
							value: [Number(coord[0]), Number(coord[1])],
							name: `${this.faultTitle(f) || '故障'}-${i}`,
							labelName: `故障 ${fi + 1} 定位点 ${i}`
						});
					}
				}
			});
			const faultPointAllSeries = (faultPointAll.length && showFaultPoints) ? {
				id: 'fault-point-all',
				name: '故障定位点与涉及登陆站',
				type: this.isGlobe ? 'scatter3D' : 'effectScatter',
				coordinateSystem: this.isGlobe ? 'globe' : 'geo',
				zlevel: 170,
				symbol: 'diamond',
				symbolSize: 14,
				itemStyle: { color: '#ff4d4f', opacity: 0.85 },
				rippleEffect: this.isGlobe ? undefined : { scale: 3.2, brushType: 'stroke', period: 2.8 },
				label: {
					show: true,
					formatter: p => (p?.data?.labelName) || '故障定位点',
					color: '#ff4d4f',
					fontWeight: 'bold',
					backgroundColor: 'rgba(40,24,4,0.65)',
					padding: [4, 6],
					borderRadius: 6,
					position: 'top',
					offset: [0, -6]
				},
				animation: false,
				data: faultPointAll
			} : null;
			const faultPickHoverSeries = (picking && this.faultPickHover) ? {
				id: 'fault-pick-hover',
				type: 'scatter',
				coordinateSystem: 'geo',
				zlevel: 181,
				symbol: 'circle',
				symbolSize: 10,
				itemStyle: { color: '#ffce83', opacity: 0.95, shadowBlur: 16, shadowColor: 'rgba(255,206,131,0.9)' },
				label: { show: false },
				silent: false,
				tooltip: {
					show: true,
					formatter: () => {
						const dist = this.faultPickHover?.distanceKm != null ? Number(this.faultPickHover.distanceKm).toFixed(2) : '-';
						return `<div class="map-tip"><div class="title">打点预览点</div><div class="row"><div class="key">实时距离</div><div class="val">${dist} km</div></div></div>`;
					}
				},
				data: [{ value: this.faultPickHover.coord, distanceKm: this.faultPickHover.distanceKm, startName: this.faultPickHover.startName }]
			} : null;
			const faultPickPathSeries = (picking && this.faultPickHover && Array.isArray(this.faultPickHover.path) && this.faultPickHover.path.length >= 2) ? {
				id: 'fault-pick-path',
				type: 'lines',
				coordinateSystem: 'geo',
				zlevel: 182,
				polyline: true,
				lineStyle: { color: '#00c853', width: 3, opacity: 0.95 },
				silent: false,
				tooltip: {
					show: true,
					formatter: () => {
						const mock = { seriesType: 'lines', data: { lineData: pickingLine, detail: this.cableDetails[pickingLine?.id] || null } };
						return pickingLine ? this.renderMapTooltip(mock) : '';
					}
				},
				data: [{ coords: this.faultPickHover.path }]
			} : null;
			const faultPickPathLockedSeries = (!picking && this.faultPickPath && Array.isArray(this.faultPickPath) && this.faultPickPath.length >= 2 && this.focusMode === 'none') ? {
				id: 'fault-pick-path-locked',
				type: 'lines',
				coordinateSystem: 'geo',
				zlevel: 182,
				polyline: true,
				lineStyle: { color: '#00c853', width: 3, opacity: 0.95 },
				silent: true,
				data: [{ coords: this.faultPickPath }]
			} : null;
			// 仅替换 series，避免旧的线/点残留
			const seriesList = [];
			if (showCablesFlag) seriesList.push(...lineSeriesList);
			// 初学者提示：2D 模式下不显示“故障涉及登陆站”的图层，仅保留红色故障定位点
			if (showLandingsFlag) {
				seriesList.push(...pointsSeriesList, ...faultLocSeries);
				if (this.isGlobe) seriesList.push(faultInvolvedLandingSeries);
			}
			if (showCablesFlag) seriesList.push(nodesSeries);
			if (faultPointAllSeries) seriesList.push(faultPointAllSeries);
			if (faultPointPulseSeries) seriesList.push(faultPointPulseSeries);
			if (faultPointSeries) seriesList.push(faultPointSeries);
			if (faultPickHoverSeries) seriesList.push(faultPickHoverSeries);
			if (faultPickPathSeries) seriesList.push(faultPickPathSeries);
			if (faultPickPathLockedSeries) seriesList.push(faultPickPathLockedSeries);
			if (showCablesFlag && cableLabelSeries) seriesList.push(cableLabelSeries);
			const baseTooltip = (() => {
				const opt = this.myChart && this.myChart.getOption ? this.myChart.getOption() : null;
				if (!opt) return {};
				if (Array.isArray(opt.tooltip)) return opt.tooltip[0] || {};
				return opt.tooltip || {};
			})();
			const tooltipPatch = { ...baseTooltip, show: true, triggerOn: 'mousemove|click', trigger: 'item' };
			const legendData2D = Array.from(new Set((seriesList || [])
				.filter(s => { const d = s && s.data; return Array.isArray(d) ? d.length > 0 : true; })
				.map(s => s && s.name)
				.filter(Boolean)));
			const legendCfg = this.legendVisible ? {
				show: true,
				orient: 'vertical', left: 10, top: 60,
				textStyle: { color: '#e8f7ff', fontSize: 12 },
				backgroundColor: 'rgba(8,15,30,0.35)', borderColor: 'rgba(72,219,251,0.35)', borderWidth: 1,
				itemWidth: 16, itemHeight: 10,
				data: legendData2D
			} : { show: false };
			this.myChart.setOption({ series: seriesList, title: { text: titleText, show: this.isMapFullscreen }, tooltip: tooltipPatch, legend: legendCfg }, { replaceMerge: ['series'] });
			this.onResize();
		},
		bindChartEvents() {
			const chart = this.myChart;
			if (!chart) return;
			if (this.chartEventTarget === chart) return;
			if (this.chartEventTarget && typeof this.chartEventTarget.off === 'function') {
				try { this.chartEventTarget.off(); } catch (e) { /* noop */ }
			}
			this.chartEventTarget = chart;
			chart.on('click', (params) => {
				try {
					if (!params) return;
					const type = String(params.seriesType || '').toLowerCase();
					const isLine = type === 'lines' || type === 'lines3d';
					const isScatter = type === 'scatter' || type === 'effectscatter' || type === 'scatter3d';
					// 点击事件（仅保留进入聚焦的调试输出）
					if (this.faultEditState.picking || this.faultEditState.pickSession || this.faultPickConfirmVisible) {
						if (this.faultEditState.picking) this.handleFaultPointPick(params);
						return;
					}
					if (isLine) {
						const raw = params.data || {};
						const lineObj = (raw && (raw.lineData || raw)) || null;
						const seg = (raw && raw.coords) || null;
						// 点击线条进入聚焦
						// 点击故障叠加线：进入故障聚焦
						if (raw && raw.fault && lineObj && (lineObj.feature_id || lineObj.id || lineObj.name)) {
							const preferName = this.normalizeText(lineObj.name || '').trim();
							const key = preferName || String(lineObj.feature_id || lineObj.id || lineObj.name);
							this.focusMode = 'fault';
							this.focusedFaultLineIds = key ? [key] : [];
							const coords = Array.isArray(seg) && seg.length ? seg : (Array.isArray(lineObj.coords) ? lineObj.coords : []);
							if (Array.isArray(coords) && coords.length) {
								const xs = coords.map(c => Number(c[0])).filter(isFinite);
								const ys = coords.map(c => Number(c[1])).filter(isFinite);
								if (xs.length && ys.length) {
									const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
									const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
									this.focusTargetCoord = [cx, cy];
									if (!this.isGlobe) {
										this.geoZoom = 3.0;
										this.myChart.setOption({ geo: { center: [cx, cy], zoom: this.geoZoom } });
									}
								}
							}
							this.updateChart();
							return;
						}
						if (lineObj && (lineObj.feature_id || lineObj.id)) {
							// 普通走线点击进入海缆聚焦
							this.focusCable(lineObj, seg);
							return;
						}
						// 兜底：从当前 option 中取对应 data 项的 lineData
						try {
							const opt = this.myChart.getOption() || {};
							const s = Array.isArray(opt.series) ? opt.series[params.seriesIndex] : null;
							const item = (s && Array.isArray(s.data)) ? s.data[params.dataIndex] : null;
							const ln2 = item && (item.lineData || null);
							const seg2 = item && (item.coords || null);
							if (ln2 && (ln2.feature_id || ln2.id)) {
								this.focusCable(ln2, seg2);
								return;
							}
						} catch (e) { /* noop */ }
					} else if (isScatter) {
						// 3D 走线拾取辅助点（含 lineData）点击聚焦海缆
						const ln = (params.data && params.data.lineData) || null;
						if (ln && (ln.feature_id || ln.id)) {
							this.focusCable(ln);
							return;
						}
						const lp = (params.data && params.data.lpData) || null;
						if (lp && Array.isArray(lp.coords)) {
							this.focusLanding(lp);
						} else {
							const val = Array.isArray(params.value) ? params.value : null;
							if (val) {
								const match = this.landingPoints.find(p => Array.isArray(p.coords) && Math.abs(Number(p.coords[0]) - Number(val[0])) < 1e-6 && Math.abs(Number(p.coords[1]) - Number(val[1])) < 1e-6);
								if (match) this.focusLanding(match);
							}
						}
					}
				} catch (e) { console.warn('地图点击聚焦失败', e); }
			});
			chart.on('mousemove', (params) => { this.onMapMouseMove(params); });
			chart.on('globalout', () => {
				try {
					if (this.faultPickHover) this.faultPickHover = null;
					if (this.hoveredCableId) {
						this.downplayCableSegments(this.hoveredCableId);
						this.hoveredCableId = null;
						this.applyHoverStyle(null);
					}
					// 防止 tooltip 悬停后遗留
					this.faultTooltip.show = false;
					this.hideLandingTooltip();
					this.hideCableTooltip();
					if (this.myChart && this.myChart.dispatchAction) {
						try { this.myChart.dispatchAction({ type: 'hideTip' }); } catch (e) { /* noop */ }
					}
				} catch (e) { /* noop */ }
			});
			chart.on('mouseover', (params) => {
				try {
					if (!params) return;
					const type = String(params.seriesType || '').toLowerCase();
					const isLine = type === 'lines' || type === 'lines3d';
					const isScatter = type === 'scatter' || type === 'effectscatter' || type === 'scatter3d';
					if (isLine) {
						const lineObj = (params.data && (params.data.lineData || params.data)) || null;
						const id = lineObj && (lineObj.id || lineObj.feature_id);
						if (id && !this.cableDetails[id]) {
							this.ensureCableDetail(id).then(() => {
								try {
									const e = params.event || {};
									const pos = (e.offsetX !== undefined && e.offsetY !== undefined) ? [e.offsetX, e.offsetY] : null;
									if (this.myChart) {
										this.myChart.dispatchAction({ type: 'showTip', seriesIndex: params.seriesIndex, dataIndex: params.dataIndex, position: pos || undefined });
									}
								} catch (e) { }
							});
						}
						if (id) {
							if (this.hoveredCableId && String(this.hoveredCableId) !== String(id)) {
								this.downplayCableSegments(this.hoveredCableId);
							}
							this.hoveredCableId = id;
							// 悬停加粗：刷新样式
							this.highlightCableSegments(id);
							this.applyHoverStyle(id);
							// 始终展示 tooltip
							try {
								const e = params.event || {};
								const pos = (e.offsetX !== undefined && e.offsetY !== undefined) ? [e.offsetX, e.offsetY] : null;
								if (this.myChart) {
									this.myChart.dispatchAction({ type: 'showTip', seriesIndex: params.seriesIndex, dataIndex: params.dataIndex, position: pos || undefined });
								}
							} catch (e) { }
						}
					} else if (isScatter) {
						// 走线拾取点 hover：高亮对应海缆并展示提示
						const ln = (params.data && params.data.lineData) || null;
						if (ln && ln.id) {
							this.highlightCableSegments(ln.id);
							this.hoveredCableId = ln.id;
							this.applyHoverStyle(ln.id);
							try {
								const e = params.event || {};
								const pos = (e.offsetX !== undefined && e.offsetY !== undefined) ? [e.offsetX, e.offsetY] : null;
								if (this.myChart) {
									this.myChart.dispatchAction({ type: 'showTip', seriesIndex: params.seriesIndex, dataIndex: params.dataIndex, position: pos || undefined });
								}
							} catch (e) { }
							return;
						}
						const lp = (params.data && params.data.lpData) || null;
						const id = lp && lp.id;
						if (lp && id && !this.stationDetails[id]) {
							this.fetchStationDetail(lp).then(() => {
								try {
									const e = params.event || {};
									const pos = (e.offsetX !== undefined && e.offsetY !== undefined) ? [e.offsetX, e.offsetY] : null;
									if (this.myChart) {
										this.myChart.dispatchAction({ type: 'showTip', seriesIndex: params.seriesIndex, dataIndex: params.dataIndex, position: pos || undefined });
									}
								} catch (e) { }
							});
						}
					}
				} catch (e) { /* noop */ }
			});
		},
		ensureChartInstance() {
			if (this.myChart && typeof this.myChart.isDisposed === 'function' && !this.myChart.isDisposed()) {
				if (this.chartEventTarget !== this.myChart) this.bindChartEvents();
				return;
			}
			const el = this.$refs.map || document.getElementById('worldCableMap');
			if (!el) return;
			const rect = el.parentElement ? el.parentElement.getBoundingClientRect() : el.getBoundingClientRect();
			if (rect?.width && rect?.height) {
				el.style.width = rect.width + 'px';
				el.style.height = rect.height + 'px';
			}
			this.myChart = echarts.init(el, null, { renderer: 'canvas', devicePixelRatio: window.devicePixelRatio || 1 });
			this.chartEventTarget = null;
			this.bindChartEvents();
		},
		onResize() {
			this.detectCompactMode();
			this.ensureChartInstance();
			if (!this.myChart) return;
			const el = this.$refs.map || document.getElementById('worldCableMap');
			if (!el) { this.myChart.resize(); return; }
			const parent = el.parentElement;
			const rect = parent ? parent.getBoundingClientRect() : el.getBoundingClientRect();
			let width = rect?.width || el.clientWidth || (parent ? parent.clientWidth : 0) || window.innerWidth;
			let height = rect?.height || el.clientHeight || (parent ? parent.clientHeight : 0) || Math.max(360, window.innerHeight * 0.6);
			const minH = Math.max(360, window.innerHeight * 0.5);
			const minW = Math.max(320, window.innerWidth * 0.4);
			if (width < minW) width = minW;
			if (height < minH) height = minH;
			if (width < 50 || height < 50) {
				setTimeout(() => this.onResize(), 120);
				setTimeout(() => this.onResize(), 260);
				return;
			}
			el.style.width = width + 'px';
			el.style.height = height + 'px';
			this.myChart.resize({ width, height });
			const opt = this.myChart.getOption ? this.myChart.getOption() : null;
			if (!opt || !opt.series || !opt.series.length) {
				this.updateChart();
			}
		}
	},
	async mounted() {
		const authed = await this.ensureUserAccess();
		if (!authed) return;
		this.mapLoading = true;
		this.mapLoadingText = '正在加载底图与脚本资源…（首次加载稍慢）';
		await this.ensureBaseMapForMode();
		this.mapLoadingText = '正在加载海缆数据…（数据量较大，请稍候）';
		await this.loadCableData();
		this.mapLoadingText = '正在加载登陆站数据…';
		await this.loadLandingPoints();
		this.mapLoadingText = '正在检测并连接故障数据接口…';
		await this.autoDetectFaultApiMode();
		this.mapLoadingText = '正在加载故障数据…';
		await this.loadFaults();
		await this.waitForMapReady();
		const container = this.$refs.map || document.getElementById('worldCableMap')
		if (!container) return
		// 先用父容器的尺寸强制赋值，避免初始化时 0 尺寸导致 ECharts 默认 100px
		const preRect = container.parentElement ? container.parentElement.getBoundingClientRect() : null;
		if (preRect && preRect.width && preRect.height) {
			container.style.width = preRect.width + 'px';
			container.style.height = preRect.height + 'px';
		}
		// 初始 2D 背景：统一使用底色主题，无需元素背景图
		this.myChart = echarts.init(container, null, { renderer: 'canvas', devicePixelRatio: window.devicePixelRatio || 1 });
		// 恢复布局与紧凑宽度
		try {
			const lp = localStorage.getItem('dp6.layout.leftPanePct');
			const th = localStorage.getItem('dp6.layout.topHeightPct');
			const cw = localStorage.getItem('dp6.layout.compactPanelWidth');
			const sc = localStorage.getItem('dp6.layout.screenCols');
			if (lp != null) this.leftPanePct = Math.max(30, Math.min(70, Number(lp) || this.leftPanePct));
			if (th != null) this.topHeightPct = Math.max(35, Math.min(85, Number(th) || this.topHeightPct));
			if (cw != null) this.compactPanelWidth = Math.max(360, Math.min(Math.round((window.innerWidth || 1600) * 0.6), Number(cw) || this.compactPanelWidth));
			if (sc) {
				try {
					const obj = JSON.parse(sc);
					const l = Math.max(12, Math.min(60, Number(obj.l) || this.leftColPct));
					const r = Math.max(20, Math.min(60, Number(obj.r) || this.rightColPct));
					let c = 100 - l - r;
					c = Math.max(30, Math.min(70, Number(obj.c) || c));
					this.leftColPct = Math.round(l * 10) / 10;
					this.centerColPct = Math.round(c * 10) / 10;
					this.rightColPct = Math.round((100 - this.leftColPct - this.centerColPct) * 10) / 10;
				} catch (e) { /* noop */ }
			}
		} catch (e) { /* noop */ }
		const lines = this.decorateLines(this.filteredCablesMap);
		const points = this.buildLandingPointsForMap(this.filteredCablesMap);
		this.mapLoadingText = '正在初始化图表并首次渲染…';
		const initOpt = this.isGlobe ? this.makeOptionGlobe(lines, points) : this.makeOption(lines, points);
		this.myChart.setOption(initOpt, true);
		// 首次加载：图表渲染完成后关闭主地图 loading
		if (this.myChart && typeof this.myChart.on === 'function') {
			this.myChart.on('finished', () => { this.mapLoading = false; this.mapLoadingText = ''; });
			// 兜底：若未触发 finished 事件，定时关闭
			setTimeout(() => { if (this.mapLoading) { this.mapLoading = false; this.mapLoadingText = ''; } }, 4000);
		}
		this.bindChartEvents();
		// 初始同步滑条位置
		this.statesToSlider();
		// 初始化后立即按最新分层刷新，确保 zlevel 生效
		this.updateChart();
		// 1s 心跳，用于故障历时刷新
		if (this.nowTickTimer) clearInterval(this.nowTickTimer);
		this.nowTickTimer = setInterval(() => { this.nowTs = Date.now(); }, 1000);
		// 地图 tooltip 芯片点击聚焦（事件委托）
		document.addEventListener('click', this.onGlobalTooltipClick, { passive: true });
		document.addEventListener('click', this.onOutsideClickCloseFaultEdit, true);
		window.addEventListener('resize', this.onResize);
		this.detectCompactMode();
		this.$nextTick(() => {
			this.onResize();
			setTimeout(this.onResize, 120);
		});
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.onResize);
		document.removeEventListener('click', this.onGlobalTooltipClick);
		document.removeEventListener('click', this.onOutsideClickCloseFaultEdit, true);
		if (this.nowTickTimer) { clearInterval(this.nowTickTimer); this.nowTickTimer = null; }
		if (this.overviewAnimFrame && typeof cancelAnimationFrame === 'function') {
			cancelAnimationFrame(this.overviewAnimFrame);
			this.overviewAnimFrame = null;
		}
		if (this.myChart) { this.myChart.dispose(); this.myChart = null; }
		this.chartEventTarget = null;
	}
});