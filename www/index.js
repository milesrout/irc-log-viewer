Vue.use(VueMaterial);

Array.prototype.rslice = function(begin, end) {
	return this.reverse().slice(begin, end).reverse();
};

const BASE_URL = "http://localhost:4000";
const DEFAULT_SPINNER_HEIGHT = 58.4;

const COLOURS = ['#d96c6c', '#ffd580', '#a3d9b8', '#001433', '#944d99',
                 '#332626', '#999173', '#1a664d', '#234d8c', '#d936ce',
                 '#bf1a00', '#f2e200', '#3de6f2', '#0000f2', '#330d26',
                 '#662e1a', '#f2ffbf', '#739699', '#0000d9', '#a60058',
                 '#f2853d', '#a1f200', '#00334d', '#0000a6', '#ffbfe1',
                 '#b39886', '#56731d', '#2d86b3', '#8f8fbf', '#e5003d',
                 '#8c4b00', '#27331a', '#39464d', '#a280ff', '#8c6973',
                 '#ffaa00', '#149900', '#40a6ff', '#240059', '#59000c',
                 '#4c3913', '#7fffa1', '#bfe1ff', '#524359', '#592d33'];

const vm = new Vue({
	el: '#app',
	data: {
		msgs: [],
		scrollingEnabled: false,
	},
	computed: {
		container() {
			return this.$el.querySelector('#msg-list');
		},
	},
	mounted() {
		this.loadInitial().then(() => {
			this.container.scrollTop = this.container.scrollHeight;
			this.scrollingEnabled = true;
			this.$nextTick(() => {
				this.$refs.infiniteLoadingBottom.$emit('$InfiniteLoading:loaded');
			});
		});
	},
	methods: {
		scrollToBottom() {
			this.container.scrollTop = this.container.scrollHeight;
		},
		userColour(name) {
			const hash = sha1.array(name);
			const index = hash[0] % COLOURS.length;
			return COLOURS[index];
		},
		loadInitial(container, before) {
			return fetch(`${BASE_URL}/initial`, {
				method: 'get'
			}).then(response => {
				return response.json().then(data => {
					this.msgs = data.slice().reverse();
				});
			});
		},
		extendAbove(msgs) {
			const container = this.$el.querySelector('#msg-list');
			return new Promise((resolve, reject) => {
				let tmp = msgs.concat(this.msgs);
				this.msgs = tmp;
				if (tmp.length <= 200) {
					this.$nextTick(() => {
						resolve(0)
					});
				} else {
					// See how high it would be without chopping off the end,
					// and return the difference between that height and how high it is
					// after doing the chopping.
					this.$nextTick(() => {
						let height = container.scrollHeight;
						this.msgs = this.msgs.slice(0, 200);

						// Make sure that the bottom loader can start loading again now
						// that we have cut off the bottom.
						this.$refs.infiniteLoadingBottom.$emit('$InfiniteLoading:reset');
						this.$refs.infiniteLoadingBottom.$emit('$InfiniteLoading:loaded');

						this.$nextTick(() => {
							resolve(height - container.scrollHeight);
						});
					});
				}
			});
		},
		extendBelow(msgs) {
			const container = this.$el.querySelector('#msg-list');
			return new Promise((resolve, reject) => {
				let tmp = this.msgs.concat(msgs);
				this.msgs = tmp;
				if (tmp.length <= 200) {
					this.$nextTick(() => {
						resolve(0)
					});
				} else {
					// See how high it would be without chopping off the end,
					// and return the difference between that height and how high it is
					// after doing the chopping.
					this.$nextTick(() => {
						let height = container.scrollHeight;
						this.msgs = this.msgs.rslice(0, 200);

						// Make sure that the bottom loader can start loading again now
						// that we have cut off the bottom.
						this.$refs.infiniteLoadingTop.$emit('$InfiniteLoading:reset');
						this.$refs.infiniteLoadingTop.$emit('$InfiniteLoading:loaded');

						this.$nextTick(() => {
							resolve(container.scrollHeight - height);
						});
					});
				}
			});
		},
		loadTop() {
			const container = this.$el.querySelector('#msg-list');
			const before = container.scrollHeight;
			return this.loadMoreAbove().then(msgs => {
				if (msgs.length === 0) {
					this.$refs.infiniteLoadingTop.$emit('$InfiniteLoading:complete');
				} else {
					this.extendAbove(msgs).then(height => {
						container.scrollTop = container.scrollHeight + height - before - DEFAULT_SPINNER_HEIGHT;
						this.$nextTick(() => {
							this.$refs.infiniteLoadingTop.$emit('$InfiniteLoading:loaded');
						});
					});
				}
			});
		},
		loadBottom() {
			const container = this.$el.querySelector('#msg-list');
			const before = container.scrollHeight;
			return this.loadMoreBelow().then(msgs => {
				if (msgs.length === 0) {
					this.$refs.infiniteLoadingBottom.$emit('$InfiniteLoading:complete');
				} else {
					this.extendBelow(msgs).then(height => {
						container.scrollTop = container.scrollTop + height + container.offsetHeight;
						this.$nextTick(() => {
							this.$refs.infiniteLoadingBottom.$emit('$InfiniteLoading:loaded');
						});
					});
				}
			});
		},
		loadMoreBelow() {
			let last = this.msgs[this.msgs.length - 1].id;
			console.log({last});
			return fetch(`${BASE_URL}/more-after?id=${last}`, {
				method: 'get'
			}).then(response => {
				return response.json();
			});
		},
		loadMoreAbove() {
			let first = this.msgs[0].id;
			console.log({first});
			return fetch(`${BASE_URL}/more-before?id=${first}`, {
				method: 'get'
			}).then(response => {
				return response.json();
			});
		},
	},
});
