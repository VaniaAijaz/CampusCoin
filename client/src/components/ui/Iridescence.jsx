import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useState, useEffect, useRef } from 'react';
import './Iridescence.css';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}) {
  const ctnDom = useRef(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile || !ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer();
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    let program;

    function resize() {
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }

    window.addEventListener('resize', resize, false);
    resize();

    const geometry = new Triangle(gl);

    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime:       { value: 0 },
        uColor:      { value: new Color(...color) },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse:      { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude:  { value: amplitude },
        uSpeed:      { value: speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId = null;
    let isVisible = true;

    function update(t) {
      if (!isVisible) {
        animateId = null;
        return;
      }
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }

    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    // Desktop optimization: Pause WebGL rendering loop when scrolled out of view or tab inactive
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting) && !document.hidden;
      if (isVisible && !animateId) {
        animateId = requestAnimationFrame(update);
      }
    }, { threshold: 0.05 });
    observer.observe(ctn);

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && !animateId) {
        animateId = requestAnimationFrame(update);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    function handleMouseMove(e) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    }

    if (mouseReact) ctn.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animateId) cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (mouseReact) ctn.removeEventListener('mousemove', handleMouseMove);
      if (ctn.contains(gl.canvas)) ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact, isMobile]);

  // Mobile Graceful Degradation: High-resolution static CSS radial gradient
  if (isMobile) {
    const r = Math.round((color[0] || 0.04) * 255);
    const g = Math.round((color[1] || 0.15) * 255);
    const b = Math.round((color[2] || 0.28) * 255);
    return (
      <div
        className="iridescence-container"
        style={{
          background: `radial-gradient(ellipse at 50% 25%, rgba(${r}, ${g}, ${b}, 0.85) 0%, rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, 0.45) 55%, #050914 100%)`,
        }}
        {...rest}
      />
    );
  }

  return <div ref={ctnDom} className="iridescence-container" {...rest} />;
}
