import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import '../../App.css'

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('rgb(255, 255, 255)');
  // const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState({});
  const [result, setResult] = useState<GeneratedResult>();
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [isEraser, setIsEraser] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;

        // Set initial background color to black
        canvas.style.background = 'black';
      }
    }

    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/config/TeX-MML-AM_CHTML.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `${expression} = ${answer}`;
    setLatexExpression([...latexExpression, latex]);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setLatexExpression([]); // Clear the analysis results
        setShowAnalysis(false); // Hide the analysis section
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isEraser) {
          ctx.clearRect(
            e.nativeEvent.offsetX - 10,
            e.nativeEvent.offsetY - 10,
            20,
            20
          ); // Erase by clearing a small area
        } else {
          ctx.strokeStyle = color;
          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          ctx.stroke();
        }
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const runRoute = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const response = await axios({
        method: 'post',
        url: `${import.meta.env.VITE_API_URL}/calculate`,
        data: {
          image: canvas.toDataURL('image/png'),
          dict_of_vars: dictOfVars,
        },
      });

      const resp = await response.data;
      console.log('Response', resp);

      resp.data.forEach((data: Response) => {
        if (data.assign === true) {
          setDictOfVars({
            ...dictOfVars,
            [data.expr]: data.result,
          });
        }

        setResult({
          expression: data.expr,
          answer: data.result,
        });
      });

      // Center the latex expression based on content
      const ctx = canvas.getContext('2d');
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      setShowAnalysis(true); // Show analysis output when results are available
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-center bg-black h-[80px]">
        <div className="text-bold text-3xl text-white logo"><span className="text-[aqua]">BrainWave</span> <span className="ps-3">Solver</span> </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={() => {
            resetCanvas();
            setShowAnalysis(false); // Hide analysis when clearing
          }}
          className="z-20 bg-gray-800 text-white hover:bg-gray-600 active:bg-gray-700 transition-colors duration-200"
          variant="default"
          color="black"
        >
          Clear Screen
        </Button>
        <Group className="z-20">
          {SWATCHES.map((swatch) => (
            <ColorSwatch
              key={swatch}
              color={swatch}
              onClick={() => {
                setColor(swatch);
                setIsEraser(false); // Disable eraser when color is changed
              }}
              className="cursor-pointer transition-transform transform hover:scale-105"
            />
          ))}
        </Group>
        <Button
          onClick={() => setIsEraser(!isEraser)} // Toggle eraser mode
          className="z-20 bg-gray-800 text-white hover:bg-gray-600 active:bg-gray-700 transition-colors duration-200"
          variant="default"
          color="white"
        >
          {isEraser ? 'Disable Eraser' : 'Enable Eraser'}
        </Button>
        <Button
          onClick={runRoute}
          className="z-20 bg-gray-800 text-white hover:bg-gray-600 active:bg-gray-700 transition-colors duration-200"
          variant="default"
          color="white"
        >
          Analyse
        </Button>
      </div>
      <div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute top-[80px] left-0 z-0"
        ></canvas>
        {latexExpression.map((latex, index) => (
          <Draggable
            key={index}
            position={latexPosition}
            onDrag={(e, data) => {
              setLatexPosition({ x: data.x, y: data.y });
            }}
          >
            <div className="z-10 text-white bg-gray-800 max-w-[700px] px-2 py-1">
              <div
                dangerouslySetInnerHTML={{
                  __html: window.MathJax?.Hub?.getAllJax(latex) || latex,
                }}
              />
            </div>
          </Draggable>
        ))}
        
      </div>
      <div className="w-full flex items-center  absolute bottom-0 left-0 z-[100] justify-center">
          <div className="logo text-white">&copy; <span className="px-3">SP</span> <span className=" text-[aqua]">bugS</span></div>
        </div>
    </>
  );
}
