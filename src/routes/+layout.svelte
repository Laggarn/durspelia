<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

<style>

	:global(body) {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100vw;
		margin: 0;
		background-color: #f0f0f0;
		padding: 40px;
	}

</style>