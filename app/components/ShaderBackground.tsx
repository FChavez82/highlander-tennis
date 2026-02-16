"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen animated WebGL shader background.
 * Renders plasma lines with grid-warping effects on a canvas fixed behind all content.
 * Source: https://21st.dev/r/minhxthanh/shader-background
 *
 * Performance optimizations:
 * - Shader strings at module scope (not re-created per render)
 * - Pauses animation when browser tab is hidden (visibilitychange)
 * - Renders at reduced resolution on high-DPI screens (0.65x device pixel ratio)
 * - Debounced resize handler (150ms) to avoid thrashing during window drag
 */

/* ── Shader sources (module scope — allocated once) ── */

const VS_SOURCE = `
	attribute vec4 aVertexPosition;
	void main() {
		gl_Position = aVertexPosition;
	}
`;

const FS_SOURCE = `
	precision highp float;
	uniform vec2 iResolution;
	uniform float iTime;

	const float overallSpeed = 0.2;
	const float gridSmoothWidth = 0.015;
	const float axisWidth = 0.05;
	const float majorLineWidth = 0.025;
	const float minorLineWidth = 0.0125;
	const float majorLineFrequency = 5.0;
	const float minorLineFrequency = 1.0;
	const vec4 gridColor = vec4(0.5);
	const float scale = 5.0;
	const vec4 lineColorGreen = vec4(0.2, 0.8, 0.3, 1.0);
	const vec4 lineColorGold = vec4(0.9, 0.7, 0.2, 1.0);
	const float minLineWidth = 0.01;
	const float maxLineWidth = 0.2;
	const float lineSpeed = 1.0 * overallSpeed;
	const float lineAmplitude = 1.0;
	const float lineFrequency = 0.2;
	const float warpSpeed = 0.2 * overallSpeed;
	const float warpFrequency = 0.5;
	const float warpAmplitude = 1.0;
	const float offsetFrequency = 0.5;
	const float offsetSpeed = 1.33 * overallSpeed;
	const float minOffsetSpread = 0.6;
	const float maxOffsetSpread = 2.0;
	const int linesPerGroup = 16;

	#define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
	#define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
	#define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
	#define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

	float drawGridLines(float axis) {
		return drawCrispLine(0.0, axisWidth, axis)
			+ drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
			+ drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
	}

	float drawGrid(vec2 space) {
		return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
	}

	float random(float t) {
		return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
	}

	float getPlasmaY(float x, float horizontalFade, float offset) {
		return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
	}

	void main() {
		vec2 fragCoord = gl_FragCoord.xy;
		vec4 fragColor;
		vec2 uv = fragCoord.xy / iResolution.xy;
		vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

		float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
		float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

		space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
		space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

		vec4 lines = vec4(0.0);
		vec4 bgColor1 = vec4(0.05, 0.12, 0.08, 1.0);
		vec4 bgColor2 = vec4(0.08, 0.2, 0.1, 1.0);

		for(int l = 0; l < linesPerGroup; l++) {
			float normalizedLineIndex = float(l) / float(linesPerGroup);
			float offsetTime = iTime * offsetSpeed;
			float offsetPosition = float(l) + space.x * offsetFrequency;
			float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
			float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
			float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
			float linePosition = getPlasmaY(space.x, horizontalFade, offset);
			float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

			float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
			vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
			float circle = drawCircle(circlePosition, 0.01, space) * 4.0;

			line = line + circle;

			/* Every 5th line gets a gold tint, the rest stay green */
			float goldMix = step(0.8, normalizedLineIndex)
				+ step(0.3, normalizedLineIndex) * (1.0 - step(0.4, normalizedLineIndex));
			vec4 lineColor = mix(lineColorGreen, lineColorGold, goldMix);
			lines += line * lineColor * rand;
		}

		fragColor = mix(bgColor1, bgColor2, uv.x);
		fragColor *= verticalFade;
		fragColor.a = 1.0;
		fragColor += lines;

		gl_FragColor = fragColor;
	}
`;

/* ── Resolution scale factor for the canvas ──
   On high-DPI screens (Retina), rendering at full devicePixelRatio means 4x the pixels.
   For a decorative background, 0.65x looks nearly identical but uses ~60% fewer pixels. */
const RESOLUTION_SCALE = 0.65;

/* ── Resize debounce delay in ms ── */
const RESIZE_DEBOUNCE_MS = 150;

export default function ShaderBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl");
		if (!gl) {
			console.warn("WebGL not supported.");
			return;
		}

		/* ── Compile and link shaders ── */
		const loadShader = (type: number, source: string) => {
			const shader = gl.createShader(type);
			if (!shader) return null;
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error("Shader compile error:", gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		};

		const vertexShader = loadShader(gl.VERTEX_SHADER, VS_SOURCE);
		const fragmentShader = loadShader(gl.FRAGMENT_SHADER, FS_SOURCE);
		if (!vertexShader || !fragmentShader) return;

		const program = gl.createProgram()!;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error("Shader link error:", gl.getProgramInfoLog(program));
			return;
		}

		/* ── Full-screen quad geometry ── */
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW
		);

		const vertexPosition = gl.getAttribLocation(program, "aVertexPosition");
		const resolutionLoc = gl.getUniformLocation(program, "iResolution");
		const timeLoc = gl.getUniformLocation(program, "iTime");

		/* ── Resize handler (debounced) ──
		   Renders at a reduced resolution to cut fill-rate cost on high-DPI displays.
		   The canvas CSS size stays at 100vw/100vh; only the internal pixel count changes. */
		let resizeTimer: ReturnType<typeof setTimeout>;
		const resizeCanvas = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				const dpr = window.devicePixelRatio || 1;
				const scale = dpr > 1 ? RESOLUTION_SCALE : 1;
				canvas.width = Math.round(window.innerWidth * dpr * scale);
				canvas.height = Math.round(window.innerHeight * dpr * scale);
				gl.viewport(0, 0, canvas.width, canvas.height);
			}, RESIZE_DEBOUNCE_MS);
		};
		/* Run immediately on mount (no debounce for the first sizing) */
		const dpr = window.devicePixelRatio || 1;
		const initialScale = dpr > 1 ? RESOLUTION_SCALE : 1;
		canvas.width = Math.round(window.innerWidth * dpr * initialScale);
		canvas.height = Math.round(window.innerHeight * dpr * initialScale);
		gl.viewport(0, 0, canvas.width, canvas.height);
		window.addEventListener("resize", resizeCanvas);

		/* ── Render loop with visibility pause ──
		   Stops burning GPU cycles when the browser tab is not visible. */
		let animId: number;
		let paused = false;
		const startTime = Date.now();
		/* Track cumulative paused time so animation resumes smoothly (no time jump) */
		let pausedAt = 0;
		let totalPausedMs = 0;

		const render = () => {
			if (paused) return;

			const currentTime = (Date.now() - startTime - totalPausedMs) / 1000;

			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(program);
			gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
			gl.uniform1f(timeLoc, currentTime);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vertexPosition);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			animId = requestAnimationFrame(render);
		};

		const handleVisibility = () => {
			if (document.hidden) {
				/* Tab became hidden — pause the render loop */
				paused = true;
				pausedAt = Date.now();
				cancelAnimationFrame(animId);
			} else {
				/* Tab became visible — resume, accounting for elapsed pause time */
				if (pausedAt > 0) {
					totalPausedMs += Date.now() - pausedAt;
					pausedAt = 0;
				}
				paused = false;
				animId = requestAnimationFrame(render);
			}
		};

		document.addEventListener("visibilitychange", handleVisibility);
		animId = requestAnimationFrame(render);

		/* ── Cleanup ── */
		return () => {
			window.removeEventListener("resize", resizeCanvas);
			document.removeEventListener("visibilitychange", handleVisibility);
			cancelAnimationFrame(animId);
			clearTimeout(resizeTimer);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 -z-10 h-full w-full"
			aria-hidden="true"
		/>
	);
}
