uint ival (in float x)
{
    return uint(x * canvas_scale_p2 + canvas_scale_p2);
}

float hamming (in uint v)
{
    int dist = 0;
    while (v != 0u)
    {
        dist++;
        v &= v - 1u;
    }
    return float(dist);
}

float norm (in vec2 p1, in vec2 p2)
{
    uint hxd = floatBitsToUint(p1.x) ^ floatBitsToUint(p2.x);
    uint hyd = floatBitsToUint(p1.y) ^ floatBitsToUint(p2.y);
    return hamming(hxd)+hamming(hyd);
}




hcol comp_values (in fdata fd)
{
    hcol ret;
    ret.h   = (fd.i1 != -1) ? 0.03*fd.d1 : 0.0;
    ret.col = getcol(fd.i1);
    return ret;
}
