#include "common.h"

Line::Line(Point &_p1, Point &_p2, double _thickness, double _blur, Color &_color) :
    p1(_p1),
    p2(_p2),
    thickness(_thickness),
    blur(_blur),
    color(_color)
{
}

Line::Line(double _thickness, double _blur, Color &_color) :
    thickness(_thickness),
    blur(_blur),
    color(_color)
{
}

bool Line::pointInView(Bitmap *bmp, int x, int y)
{
    return !((x+thickness < 0) || (x-thickness > bmp->getWidth()) ||
        (y+thickness < 0) || (y-thickness > bmp->getHeight()));
}


void Line::drawEnd(Bitmap *bmp, int x, int y)
{
    // Optimize on out of view
    if (!pointInView(bmp, x, y)) return;

    for (int j = -thickness; j<thickness; ++j) {
        for (int k = -thickness; k<thickness; ++k) {
            double dist = sqrt(j*j + k*k);
            if (dist <= thickness)
                bmp->setPoint((int)x+j, (int)y+k, alpha(dist), color);
        }
    }
}

void Line::drawSection(Bitmap *bmp, int x1, int x2, int y1, int y2)
{
    // Optimize on out of view
    if ((!pointInView(bmp, x1, y1)) && (!pointInView(bmp, x2, y2))) return;

    double dx = (double)x2 - (double)x1;
    double dy = (double)y2 - (double)y1;
    int points = (int)(fabs(dx) > fabs(dy) ? fabs(dx) : fabs(dy));
    if (points > 0) {
        dx /= points;
        dy /= points;

        double t = -thickness;
        double dt = 0.5;
        for (double t=-thickness; t<=thickness; t += 0.5) {
            double dist0 = fabs(sqrt(dy*dy + dx*dx) * t);
            double dist1 = sqrt(dx*dx*(t+1)*(t+1) + dy*dy*t*t);
            double dist2 = sqrt(dy*dy*(t+1)*(t+1) + dx*dx*t*t);
            BYTE a0 = alpha(dist0);
            BYTE a1 = alpha(dist1);
            BYTE a2 = alpha(dist2);

            double x = x1;
            double y = y1;

            for (int i=0; i<points; ++i) {
                bmp->setPoint((int)x-dy*t, (int)y+dx*t, a0, color);
                bmp->setPoint((int)x-dy*t, (int)y+dx*(t+1), a1, color);
                bmp->setPoint((int)x-dy*(t+1), (int)y+dx*t, a2, color);

                x += dx;
                y += dy;
            }
        }
    }
}

int Line::alpha(double distance)
{
    if (blur == 0) return 0xFF;
    else if (distance > thickness) return 0;
    else if (distance < thickness - blur) return 0xFF;
    else {
        int a = 0xFF - (int)((double)0xFF * (distance - thickness + blur) / blur);
        if (a < 0) a = 0;
        if (a > 0xFF) a = 0xFF;
        return a;
    }
}


void Line::draw(Bitmap *bmp)
{
    // Begin and end as circles
    drawEnd(bmp, p1.x, p1.y);
    drawEnd(bmp, p2.x, p2.y);

    // Draw the rest as fading lines
    drawSection(bmp, p1.x, p2.x, p1.y, p2.y);
}

void Line::DrawWuLine(Bitmap *bmp, int x0, int y0, int x1, int y1)
{
    //Вычисление изменения координат
    int dx = (x1 > x0) ? (x1 - x0) : (x0 - x1);
    int dy = (y1 > y0) ? (y1 - y0) : (y0 - y1);
    //Если линия параллельна одной из осей, рисуем обычную линию - заполняем все пикселы в ряд
    if (dx == 0)
    {
        for (int i=y0; i<=y1; i++) PutPixel(bmp, color, x0, i, 255);
        return;
    }
    if (dy == 0)
    {
        for (int i=x0; i<=x1; i++) PutPixel(bmp, color, i, y0, 255);
        return;
    }

    //Для Х-линии (коэффициент наклона < 1)
    if (dy < dx)
    {
        //Первая точка должна иметь меньшую координату Х
        if (x1 < x0)
        {
            x1 += x0; x0 = x1 - x0; x1 -= x0;
            y1 += y0; y0 = y1 - y0; y1 -= y0;
        }
        //Относительное изменение координаты Y
        float grad = (float)dy / dx;
        if (y1 < y0) grad=-grad;
        //Промежуточная переменная для Y
        float intery = y0 + grad;
        //Первая точка
        PutPixel(bmp, color, x0, y0, 255);

        for (int x = x0 + 1; x < x1; x++)
        {
            //Верхняя точка
            PutPixel(bmp, color, x, IPart(intery), (int)(255 - FPart(intery) * 255));
            //Нижняя точка
            PutPixel(bmp, color, x, IPart(intery) + 1, (int)(FPart(intery) * 255));
            //Изменение координаты Y
            intery += grad;
        }
        //Последняя точка
        PutPixel(bmp, color, x1, y1, 255);
    }
    //Для Y-линии (коэффициент наклона > 1)
    else
    {
        //Первая точка должна иметь меньшую координату Y
        if (y1 < y0)
        {
            x1 += x0; x0 = x1 - x0; x1 -= x0;
            y1 += y0; y0 = y1 - y0; y1 -= y0;
        }
        //Относительное изменение координаты X
        float grad = (float)dx / dy;
        if (x1 < x0) grad=-grad;
        //Промежуточная переменная для X
        float interx = x0 + grad;
        //Первая точка
        PutPixel(bmp, color, x0, y0, 255);

        for (int y = y0 + 1; y < y1; y++)
        {
            //Верхняя точка
            PutPixel(bmp, color, IPart(interx), y, 255 - (int)(FPart(interx) * 255));
            //Нижняя точка
            PutPixel(bmp, color, IPart(interx) + 1, y, (int)(FPart(interx) * 255));
            //Изменение координаты X
            interx += grad;
        }
        //Последняя точка
        PutPixel(bmp, color, x1, y1, 255);
    }
}

//Метод, устанавливающий пиксел на форме с заданными цветом и прозрачностью
void Line::PutPixel(Bitmap *bmp, Color &col, int x, int y, int alpha)
{
    bmp->setPoint(x, y, alpha, col);
}

 //Целая часть числа
int Line::IPart(float x)
{
   return (int)x;
}

//дробная часть числа
float Line::FPart(float x)
{
    return x - (double)(int)x;
}
